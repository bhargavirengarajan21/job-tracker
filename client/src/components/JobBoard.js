import React, { useState, useEffect, useCallback } from 'react';
import api from '../api';

const DEFAULT_SHEET_URL =
  'https://docs.google.com/spreadsheets/d/16-MJFCOfAfCtEETwl8c6SuI4mr6Bm63ViVrTNUBuPUU/edit?gid=0#gid=0';


// Pipeline steps shown while an Apply is running, in order.
const STEPS = [
  'Scraping job description',
  'Scoring resume against JD',
  'Generating tailored resume',
  'Writing outreach',
  'Logging application'
];

function tierStyle(tier) {
  const t = (tier || '').toLowerCase();
  if (t === 'strong') return { background: '#dcfce7', color: '#16a34a', border: '1px solid #bbf7d0' };
  if (t === 'good') return { background: '#dbeafe', color: '#1d4ed8', border: '1px solid #bfdbfe' };
  if (t === 'stretch') return { background: '#fef3c7', color: '#d97706', border: '1px solid #fde68a' };
  return { background: '#f3f4f6', color: '#6b7280', border: '1px solid #e5e7eb' };
}

function parseMissing(raw) {
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw);
    if (Array.isArray(arr)) return arr.filter(Boolean);
  } catch { /* not JSON — fall through */ }
  return String(raw).split(',').map(s => s.trim()).filter(Boolean);
}

function JobBoard() {
  const [sheetUrl, setSheetUrl] = useState(DEFAULT_SHEET_URL);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showDeclined, setShowDeclined] = useState(false);
  // pipeline[url] = { step, done, error, score, demonstratedScore, changeLog, outreach, filename }
  const [pipeline, setPipeline] = useState({});
  const [expanded, setExpanded] = useState({});
  const [copied, setCopied] = useState('');

  const loadBoard = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/jobs/board', { params: { sheetUrl } });
      setJobs(data.jobs || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load the sheet');
    } finally {
      setLoading(false);
    }
  }, [sheetUrl]);

  useEffect(() => { loadBoard(); }, [loadBoard]);

  const setJobDecision = (url, decision) => {
    setJobs(prev => prev.map(j => (j.url === url ? { ...j, decision } : j)));
  };

  const updatePipeline = (url, patch) => {
    setPipeline(prev => ({ ...prev, [url]: { ...prev[url], ...patch } }));
  };

  const copyText = async (text, key) => {
    await navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(''), 2000);
  };

  const handleDecline = async (job) => {
    setJobDecision(job.url, 'declined');
    try { await api.post('/jobs/decision', { url: job.url, status: 'declined' }); }
    catch { /* best-effort persistence */ }
  };

  const handleApply = async (job) => {
    setError('');
    setExpanded(prev => ({ ...prev, [job.url]: true }));
    updatePipeline(job.url, { step: 0, done: false, error: '', changeLog: null, outreach: null });

    try {
      // 1. Scrape the job description from the posting URL
      const scrapeRes = await api.post('/ats/scrape', { url: job.url });
      const jobDescription = scrapeRes.data.jobDescription;
      if (!jobDescription) throw new Error('Could not read a job description from this posting');

      // 2. Score the master resume (main.tex) against the JD — JSON, no file needed
      updatePipeline(job.url, { step: 1 });
      const { data: scoreData } = await api.post('/ats/score', {
        jobDescription,
        company: job.company,
        position: job.title,
      });

      const recruiter = scoreData.recruiterScreen || {};
      const missingRequired = scoreData.requiredMissing || [];
      const missingPreferred = (scoreData.missingKeywords || []).filter(k => k.priority === 'preferred');
      const demonstratedMissing = scoreData.demonstratedMissing || [];
      const linesToRemove = Array.from(new Set([
        ...(recruiter.lineByLineAudit || [])
          .filter(l => l.verdict === 'remove' || l.relevance === 'none')
          .map(l => l.line),
        ...(recruiter.removeToSaveSpace || [])
      ].filter(Boolean)));
      const skillsToRemove = (recruiter.irrelevantSkills || []).map(s => s.skill || s).filter(Boolean);

      // Fold "demonstrated but keyword missing" preferred skills into what gets added.
      const preferredKeys = new Set(missingPreferred.map(k => (k.keyword || k || '').toLowerCase()));
      const demonstratedPreferred = demonstratedMissing
        .filter(k => k.priority !== 'required' && !preferredKeys.has((k.keyword || '').toLowerCase()));
      const missingPreferredMerged = [...missingPreferred, ...demonstratedPreferred];

      // 3. Generate tailored resume via tex-based pipeline (returns .tex directly)
      updatePipeline(job.url, { step: 2, score: scoreData.score, demonstratedScore: scoreData.demonstratedScore });
      const previewRes = await api.post('/ats/preview-tex', {
        jobDescription,
        company: job.company,
        position: job.title,
        linesToRemove,
        skillsToRemove,
        missingRequired,
        missingPreferred: missingPreferredMerged,
      });
      const { tailoredTex, changeList, filename: texFilename } = previewRes.data;

      if (!tailoredTex) throw new Error('Preview generation failed — no tailored .tex returned');

      // Download the tailored .tex file
      const blob = new Blob([tailoredTex], { type: 'application/x-tex' });
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = texFilename || 'tailored_resume.tex';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);

      const filename = texFilename || 'tailored_resume.tex';
      const changeLog = changeList || [];

      // Compile PDF + score tailored resume in parallel (best-effort)
      let pdfUrl = null;
      let tailoredScore = null;
      let tailoredDemonstrated = null;

      const pdfPromise = api.post('/ats/compile-tex', {
        texContent: tailoredTex,
        filename: filename.replace(/\.tex$/, ''),
      }, { responseType: 'blob' }).then(res => {
        pdfUrl = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      }).catch(() => {});

      const scorePromise = api.post('/ats/score-tailored', {
        texContent: tailoredTex,
        jobDescription,
      }).then(res => {
        tailoredScore = res.data.score;
        tailoredDemonstrated = res.data.demonstratedScore;
      }).catch(() => {});

      await Promise.all([pdfPromise, scorePromise]);

      // 4. Outreach (HM + recruiter emails, LinkedIn message)
      updatePipeline(job.url, {
        step: 3, changeLog, filename, pdfUrl,
        tailoredScore, tailoredDemonstrated,
      });
      let outreach = null;
      try {
        const { data } = await api.post('/ats/outreach', {
          jobDescription, company: job.company, position: job.title
        });
        outreach = data;
      } catch { /* outreach is best-effort — resume already downloaded */ }

      // 5. Log to Applications + record the decision
      updatePipeline(job.url, { step: 4, outreach });
      await api.post('/applications', {
        company: job.company || 'Unknown',
        position: job.title || 'Unknown',
        status: 'applied',
        ats_score: scoreData.score || null,
        job_url: job.url,
        notes: `Auto-applied from Job Board. ATS ${scoreData.score}% (demonstrated ${scoreData.demonstratedScore}%).`,
        linkedin_message: outreach?.linkedin_message || null,
        email_subject: outreach?.hm_email_subject || null,
        email_body: outreach?.hm_email_body || null
      });
      await api.post('/jobs/decision', { url: job.url, status: 'applied' });

      updatePipeline(job.url, { step: STEPS.length, done: true });
      setJobDecision(job.url, 'applied');
    } catch (err) {
      updatePipeline(job.url, { error: err.response?.data?.error || err.message || 'Apply failed' });
    }
  };

  const visibleJobs = jobs.filter(j => showDeclined || j.decision !== 'declined');
  const declinedCount = jobs.filter(j => j.decision === 'declined').length;
  const appliedCount = jobs.filter(j => j.decision === 'applied').length;

  return (
    <div>
      <h2 style={{ marginBottom: 6 }}>Job Board</h2>
      <p style={{ color: '#666', marginBottom: 16 }}>
        Loads jobs from your Google Sheet. Hit <strong>Apply</strong> on a job to
        automatically scrape the JD, score your master resume, generate a tailored version, and draft outreach — or <strong>Decline</strong> to skip it.
      </p>

      {/* Sheet controls */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-end', marginBottom: 16 }}>
        <div className="form-group" style={{ margin: 0, flex: '2 1 340px' }}>
          <label>Google Sheet URL</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input type="url" value={sheetUrl} onChange={e => setSheetUrl(e.target.value)} style={{ flex: 1 }} />
            <button className="btn btn-primary" onClick={loadBoard} disabled={loading} style={{ whiteSpace: 'nowrap' }}>
              {loading ? 'Loading...' : 'Reload'}
            </button>
          </div>
          <p style={{ fontSize: '0.76rem', color: '#888', marginTop: 4 }}>
            The sheet must be shared as "Anyone with the link can view".
          </p>
        </div>
      </div>

      {error && <div className="error-message" style={{ marginBottom: 12 }}>{error}</div>}

      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 12, fontSize: '0.85rem', color: '#666' }}>
        <span>{visibleJobs.length} shown</span>
        <span style={{ color: '#16a34a' }}>{appliedCount} applied</span>
        <span style={{ color: '#dc2626' }}>{declinedCount} declined</span>
        {declinedCount > 0 && (
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
            <input type="checkbox" checked={showDeclined} onChange={e => setShowDeclined(e.target.checked)} />
            Show declined
          </label>
        )}
      </div>

      {loading && jobs.length === 0 ? (
        <div className="empty-state"><h3>Loading jobs…</h3></div>
      ) : visibleJobs.length === 0 ? (
        <div className="empty-state">
          <h3>No jobs to show</h3>
          <p>Reload the sheet, or uncheck filters.</p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '2px solid #e5e7eb', color: '#374151' }}>
                <th style={{ padding: '10px 8px' }}>Company</th>
                <th style={{ padding: '10px 8px' }}>Title</th>
                <th style={{ padding: '10px 8px' }}>Location</th>
                <th style={{ padding: '10px 8px' }}>Level</th>
                <th style={{ padding: '10px 8px' }}>Match</th>
                <th style={{ padding: '10px 8px' }}>Gaps</th>
                <th style={{ padding: '10px 8px', textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {visibleJobs.map((job) => {
                const p = pipeline[job.url];
                const running = p && !p.done && !p.error;
                const missing = parseMissing(job.missing);
                const isOpen = expanded[job.url];
                return (
                  <React.Fragment key={job.url}>
                    <tr style={{ borderBottom: '1px solid #f1f5f9', opacity: job.decision === 'declined' ? 0.5 : 1 }}>
                      <td style={{ padding: '10px 8px', fontWeight: 600 }}>{job.company}</td>
                      <td style={{ padding: '10px 8px' }}>
                        <a href={job.url} target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb', textDecoration: 'none' }}>
                          {job.title}
                        </a>
                      </td>
                      <td style={{ padding: '10px 8px', color: '#666', fontSize: '0.82rem' }}>{job.location}</td>
                      <td style={{ padding: '10px 8px', color: '#666', textTransform: 'capitalize' }}>{job.seniority}</td>
                      <td style={{ padding: '10px 8px', whiteSpace: 'nowrap' }}>
                        {job.atsScore && <strong>{job.atsScore}%</strong>}
                        {job.tier && (
                          <span style={{ marginLeft: 6, fontSize: '0.7rem', padding: '2px 8px', borderRadius: 10, fontWeight: 600, ...tierStyle(job.tier) }}>
                            {job.tier}
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '10px 8px', color: '#b45309', fontSize: '0.8rem', maxWidth: 180 }}>
                        {missing.slice(0, 4).join(', ')}{missing.length > 4 ? ` +${missing.length - 4}` : ''}
                      </td>
                      <td style={{ padding: '10px 8px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                        {job.decision === 'applied' ? (
                          <span style={{ color: '#16a34a', fontWeight: 600, fontSize: '0.82rem' }}>
                            ✓ Applied
                            <button className="btn btn-secondary" style={{ marginLeft: 8, padding: '3px 10px', fontSize: '0.76rem' }}
                              onClick={() => setExpanded(prev => ({ ...prev, [job.url]: !isOpen }))}>
                              {isOpen ? 'Hide' : 'Details'}
                            </button>
                          </span>
                        ) : job.decision === 'declined' ? (
                          <button className="btn btn-secondary" style={{ padding: '4px 12px', fontSize: '0.8rem' }}
                            onClick={() => { setJobDecision(job.url, 'pending'); api.post('/jobs/decision', { url: job.url, status: 'pending' }).catch(() => {}); }}>
                            Undo
                          </button>
                        ) : (
                          <div style={{ display: 'inline-flex', gap: 6 }}>
                            <button className="btn btn-primary" style={{ padding: '4px 14px', fontSize: '0.8rem' }}
                              onClick={() => handleApply(job)} disabled={running}>
                              {running ? 'Applying…' : 'Apply'}
                            </button>
                            <button className="btn btn-secondary" style={{ padding: '4px 14px', fontSize: '0.8rem' }}
                              onClick={() => handleDecline(job)} disabled={running}>
                              Decline
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>

                    {/* Expanded pipeline / results panel */}
                    {p && isOpen && (
                      <tr>
                        <td colSpan={7} style={{ padding: '0 8px 16px', background: '#f8fafc' }}>
                          <div style={{ padding: 16, border: '1px solid #e2e8f0', borderRadius: 8, background: '#fff' }}>
                            {/* Progress steps */}
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: p.done || p.error ? 12 : 0 }}>
                              {STEPS.map((label, i) => {
                                const state = p.error && i === p.step ? 'error'
                                  : (p.done || i < p.step) ? 'done'
                                  : i === p.step ? 'active' : 'todo';
                                const color = state === 'done' ? '#16a34a' : state === 'active' ? '#2563eb' : state === 'error' ? '#dc2626' : '#9ca3af';
                                return (
                                  <span key={label} style={{ fontSize: '0.8rem', color, fontWeight: state === 'todo' ? 400 : 600 }}>
                                    {state === 'done' ? '✓' : state === 'error' ? '✕' : state === 'active' ? '⟳' : '○'} {label}
                                  </span>
                                );
                              })}
                            </div>

                            {p.error && <div className="error-message" style={{ marginTop: 8 }}>{p.error}</div>}

                            {(p.done || p.score != null) && (
                              <div style={{ display: 'flex', gap: 12, marginBottom: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                                {p.score != null && (
                                  <div style={{ padding: '6px 12px', borderRadius: 8, background: '#f1f5f9', fontSize: '0.85rem' }}>
                                    Original ATS <strong>{p.score}%</strong>
                                  </div>
                                )}
                                {p.tailoredScore != null && (
                                  <>
                                    <span style={{ color: '#9ca3af' }}>→</span>
                                    <div style={{ padding: '6px 12px', borderRadius: 8, fontSize: '0.85rem', fontWeight: 600,
                                      background: p.tailoredScore >= 70 ? '#dcfce7' : p.tailoredScore >= 40 ? '#fef3c7' : '#fee2e2',
                                      color: p.tailoredScore >= 70 ? '#16a34a' : p.tailoredScore >= 40 ? '#d97706' : '#dc2626'
                                    }}>
                                      Tailored <strong>{p.tailoredScore}%</strong>
                                    </div>
                                    <div style={{
                                      padding: '3px 8px', borderRadius: 8, fontSize: '0.75rem', fontWeight: 600,
                                      background: p.tailoredScore > p.score ? '#dcfce7' : p.tailoredScore < p.score ? '#fee2e2' : '#f1f5f9',
                                      color: p.tailoredScore > p.score ? '#16a34a' : p.tailoredScore < p.score ? '#dc2626' : '#666'
                                    }}>
                                      {p.tailoredScore > p.score ? '+' : ''}{p.tailoredScore - (p.score || 0)}%
                                    </div>
                                  </>
                                )}
                                {p.demonstratedScore != null && !p.tailoredScore && (
                                  <div style={{ padding: '6px 12px', borderRadius: 8, background: '#ecfeff', fontSize: '0.85rem', color: '#0e7490' }}>
                                    Demonstrated <strong>{p.demonstratedScore}%</strong>
                                  </div>
                                )}
                                {p.filename && (
                                  <div style={{ padding: '6px 12px', borderRadius: 8, background: '#f0fdf4', fontSize: '0.85rem', color: '#16a34a' }}>
                                    ⤓ {p.filename} downloaded
                                  </div>
                                )}
                              </div>
                            )}

                            {p.changeLog?.length > 0 && (
                              <details style={{ marginBottom: 12 }}>
                                <summary style={{ cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, color: '#166534' }}>
                                  Resume changes ({p.changeLog.length})
                                </summary>
                                <div style={{ marginTop: 6 }}>
                                  {p.changeLog.map((c, i) => (
                                    <div key={i} style={{ fontSize: '0.8rem', color: '#166534', marginBottom: 2 }}>• {c}</div>
                                  ))}
                                </div>
                              </details>
                            )}

                            {p.pdfUrl && (
                              <div style={{
                                border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden',
                                marginTop: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.06)'
                              }}>
                                <div style={{
                                  padding: '6px 12px', background: '#f1f5f9', borderBottom: '1px solid #e2e8f0',
                                  fontSize: '0.75rem', color: '#666'
                                }}>
                                  PDF Preview
                                </div>
                                <iframe
                                  src={p.pdfUrl}
                                  title="Resume preview"
                                  style={{ width: '100%', height: 500, border: 'none' }}
                                />
                              </div>
                            )}

                            {p.outreach && (
                              <div style={{ display: 'grid', gap: 10 }}>
                                {[
                                  { key: 'hm', label: 'Hiring Manager Email', subject: p.outreach.hm_email_subject, body: p.outreach.hm_email_body },
                                  { key: 'rec', label: 'Recruiter Email', subject: p.outreach.recruiter_email_subject, body: p.outreach.recruiter_email_body }
                                ].filter(b => b.subject || b.body).map(block => (
                                  <div key={block.key} style={{ border: '1px solid #e5e7eb', borderRadius: 6, padding: 10 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                                      <strong style={{ fontSize: '0.82rem' }}>{block.label}</strong>
                                      <button className="btn btn-secondary" style={{ padding: '2px 10px', fontSize: '0.74rem' }}
                                        onClick={() => copyText(`${block.subject}\n\n${block.body}`, `${job.url}-${block.key}`)}>
                                        {copied === `${job.url}-${block.key}` ? 'Copied!' : 'Copy'}
                                      </button>
                                    </div>
                                    <div style={{ fontSize: '0.82rem', fontWeight: 600, marginBottom: 4 }}>{block.subject}</div>
                                    <div style={{ fontSize: '0.82rem', whiteSpace: 'pre-wrap', lineHeight: 1.6, color: '#374151' }}>{block.body}</div>
                                  </div>
                                ))}
                                {p.outreach.linkedin_message && (
                                  <div style={{ border: '1px solid #e5e7eb', borderRadius: 6, padding: 10 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                                      <strong style={{ fontSize: '0.82rem' }}>LinkedIn Message</strong>
                                      <button className="btn btn-secondary" style={{ padding: '2px 10px', fontSize: '0.74rem' }}
                                        onClick={() => copyText(p.outreach.linkedin_message, `${job.url}-li`)}>
                                        {copied === `${job.url}-li` ? 'Copied!' : 'Copy'}
                                      </button>
                                    </div>
                                    <div style={{ fontSize: '0.82rem', whiteSpace: 'pre-wrap', lineHeight: 1.6, color: '#374151' }}>{p.outreach.linkedin_message}</div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default JobBoard;
