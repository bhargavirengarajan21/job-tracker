import React, { useState } from 'react';
import api from '../api';

function ATSScorer() {
  const [jobDescription, setJobDescription] = useState('');
  const [jobUrl, setJobUrl] = useState('');
  const [scraping, setScraping] = useState(false);
  const [scraped, setScraped] = useState(false);
  const [file, setFile] = useState(null);
  const [results, setResults] = useState(null);
  const [activeResultTab, setActiveResultTab] = useState('ats');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleScrape = async () => {
    if (!jobUrl.trim()) {
      setError('Please enter a job posting URL');
      return;
    }
    setScraping(true);
    setScraped(false);
    setError('');
    try {
      const { data } = await api.post('/ats/scrape', { url: jobUrl });
      setJobDescription(data.jobDescription);
      setScraped(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch job posting');
    } finally {
      setScraping(false);
    }
  };

  const handleScore = async (e) => {
    e.preventDefault();
    if (!jobDescription.trim()) {
      setError('Please enter a job description');
      return;
    }
    if (!file) {
      setError('Please upload your resume (PDF or DOCX)');
      return;
    }

    setLoading(true);
    setError('');
    setResults(null);
    setActiveResultTab('ats');

    const formData = new FormData();
    formData.append('jobDescription', jobDescription);
    formData.append('resume', file);

    try {
      const { data } = await api.post('/ats/score', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setResults(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to analyze resume');
    } finally {
      setLoading(false);
    }
  };

  const getScoreClass = (score) => {
    if (score >= 70) return 'score-high';
    if (score >= 40) return 'score-medium';
    return 'score-low';
  };

  const getVerdictStyle = (verdict) => {
    if (verdict === 'pass') return { background: '#dcfce7', color: '#16a34a', border: '1px solid #bbf7d0' };
    if (verdict === 'maybe') return { background: '#fef3c7', color: '#d97706', border: '1px solid #fde68a' };
    return { background: '#fee2e2', color: '#dc2626', border: '1px solid #fecaca' };
  };

  const getScoreBarColor = (score) => {
    if (score >= 4) return '#16a34a';
    if (score >= 3) return '#d97706';
    return '#dc2626';
  };

  const rs = results?.recruiterScreen;

  return (
    <div>
      <h2 style={{ marginBottom: 20 }}>ATS & Recruiter Screening</h2>
      <p style={{ color: '#666', marginBottom: 20 }}>
        Paste a job posting link to automatically scrape the description, or type it manually.
        AI runs both an ATS keyword scan and a 6-second recruiter screen on your resume.
      </p>

      <div className="ats-container">
        <div className="ats-input">
          <form onSubmit={handleScore}>
            <div className="form-group">
              <label>Job Posting URL</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="url"
                  value={jobUrl}
                  onChange={(e) => { setJobUrl(e.target.value); setScraped(false); }}
                  placeholder="https://careers.example.com/jobs/12345"
                  style={{ flex: 1 }}
                />
                <button
                  type="button"
                  className="btn btn-success"
                  onClick={handleScrape}
                  disabled={scraping || !jobUrl.trim()}
                  style={{ whiteSpace: 'nowrap' }}
                >
                  {scraping ? 'Scraping...' : 'Scrape Job'}
                </button>
              </div>
              <p style={{ fontSize: '0.8rem', color: '#888', marginTop: 4 }}>
                Supports most job boards — LinkedIn, Indeed, Greenhouse, Lever, Workday, and company career pages.
              </p>
              {scraped && (
                <p style={{ fontSize: '0.8rem', color: '#16a34a', marginTop: 4, fontWeight: 500 }}>
                  Job description scraped successfully — review it below and score your resume.
                </p>
              )}
            </div>

            <div className="form-group">
              <label>Job Description</label>
              <textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the full job description here, or scrape it from a URL above..."
                style={{ minHeight: 200 }}
              />
            </div>

            <div className="form-group">
              <label>Upload Resume (PDF or DOCX)</label>
              <input
                type="file"
                accept=".pdf,.docx"
                onChange={(e) => setFile(e.target.files[0])}
                style={{ padding: '8px 0' }}
              />
              {file && <p style={{ fontSize: '0.85rem', color: '#666', marginTop: 4 }}>{file.name}</p>}
            </div>

            {error && <div className="error-message">{error}</div>}

            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Analyzing...' : 'Score Resume'}
            </button>
          </form>
        </div>

        <div className="ats-results">
          {!results && !loading && (
            <div className="empty-state">
              <h3>Results will appear here</h3>
              <p>Scrape a job posting or paste a description, then upload your resume to get your ATS match score and recruiter screening.</p>
            </div>
          )}

          {loading && (
            <div className="empty-state">
              <h3>Analyzing your resume...</h3>
              <p>AI is running ATS keyword matching and simulating a recruiter's 6-second scan.</p>
            </div>
          )}

          {results && (
            <div>
              {/* Result tabs */}
              <div style={{ display: 'flex', gap: 0, borderBottom: '2px solid #e1e5eb', marginBottom: 20 }}>
                <button
                  onClick={() => setActiveResultTab('ats')}
                  style={{
                    padding: '10px 20px', border: 'none', background: 'none', cursor: 'pointer',
                    fontWeight: activeResultTab === 'ats' ? 600 : 400,
                    color: activeResultTab === 'ats' ? '#2563eb' : '#666',
                    borderBottom: activeResultTab === 'ats' ? '2px solid #2563eb' : '2px solid transparent',
                    marginBottom: -2, fontSize: '0.95rem'
                  }}
                >
                  ATS Keywords
                </button>
                <button
                  onClick={() => setActiveResultTab('recruiter')}
                  style={{
                    padding: '10px 20px', border: 'none', background: 'none', cursor: 'pointer',
                    fontWeight: activeResultTab === 'recruiter' ? 600 : 400,
                    color: activeResultTab === 'recruiter' ? '#2563eb' : '#666',
                    borderBottom: activeResultTab === 'recruiter' ? '2px solid #2563eb' : '2px solid transparent',
                    marginBottom: -2, fontSize: '0.95rem'
                  }}
                >
                  6-Second Screen
                </button>
                <button
                  onClick={() => setActiveResultTab('grammar')}
                  style={{
                    padding: '10px 20px', border: 'none', background: 'none', cursor: 'pointer',
                    fontWeight: activeResultTab === 'grammar' ? 600 : 400,
                    color: activeResultTab === 'grammar' ? '#2563eb' : '#666',
                    borderBottom: activeResultTab === 'grammar' ? '2px solid #2563eb' : '2px solid transparent',
                    marginBottom: -2, fontSize: '0.95rem'
                  }}
                >
                  Grammar & Design
                </button>
                <button
                  onClick={() => setActiveResultTab('cleanup')}
                  style={{
                    padding: '10px 20px', border: 'none', background: 'none', cursor: 'pointer',
                    fontWeight: activeResultTab === 'cleanup' ? 600 : 400,
                    color: activeResultTab === 'cleanup' ? '#2563eb' : '#666',
                    borderBottom: activeResultTab === 'cleanup' ? '2px solid #2563eb' : '2px solid transparent',
                    marginBottom: -2, fontSize: '0.95rem'
                  }}
                >
                  Remove / Cleanup
                </button>
              </div>

              {/* ATS Tab */}
              {activeResultTab === 'ats' && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                    <h3>ATS Match Score</h3>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {results.autoReject && (
                        <span style={{ fontSize: '0.75rem', background: '#fee2e2', color: '#dc2626', padding: '3px 10px', borderRadius: 12, fontWeight: 600 }}>
                          AUTO-REJECT RISK
                        </span>
                      )}
                      {results.keywordSource === 'ai' && (
                        <span style={{ fontSize: '0.75rem', background: '#ede9fe', color: '#7c3aed', padding: '3px 10px', borderRadius: 12, fontWeight: 500 }}>
                          ATS Engine
                        </span>
                      )}
                    </div>
                  </div>

                  <div className={`score-circle ${getScoreClass(results.score)}`}>
                    {results.score}%
                  </div>
                  <p style={{ textAlign: 'center', color: '#666', marginBottom: 6 }}>
                    Weighted ATS Score
                  </p>
                  <p style={{ textAlign: 'center', color: '#999', fontSize: '0.8rem', marginBottom: 20 }}>
                    {results.matchedKeywords.length} of {results.totalKeywords} keywords matched
                    {results.requiredMissing?.length > 0 && (
                      <span style={{ color: '#dc2626', fontWeight: 500 }}>
                        {' '}· {results.requiredMissing.length} required missing
                      </span>
                    )}
                  </p>

                  {/* Category breakdown */}
                  {results.categoryScores && Object.keys(results.categoryScores).length > 0 && (
                    <div style={{ marginBottom: 20 }}>
                      <h4 style={{ marginBottom: 10 }}>Category Breakdown</h4>
                      {Object.entries(results.categoryScores).map(([cat, data]) => {
                        const labels = {
                          hardSkills: 'Hard Skills', softSkills: 'Soft Skills', tools: 'Tools & Platforms',
                          education: 'Education', experience: 'Experience', certifications: 'Certifications'
                        };
                        const barColor = data.percentage >= 70 ? '#16a34a' : data.percentage >= 40 ? '#d97706' : '#dc2626';
                        return (
                          <div key={cat} style={{ marginBottom: 12 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: 3 }}>
                              <span style={{ fontWeight: 500 }}>{labels[cat] || cat}</span>
                              <span style={{ color: '#666' }}>
                                {data.matched.length}/{data.matched.length + data.missing.length} · {data.percentage}%
                              </span>
                            </div>
                            <div style={{ background: '#e5e7eb', borderRadius: 4, height: 8, overflow: 'hidden' }}>
                              <div style={{ width: `${data.percentage}%`, height: '100%', background: barColor, borderRadius: 4 }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Matched */}
                  <div>
                    <h4 style={{ marginBottom: 8, color: '#16a34a' }}>Matched ({results.matchedKeywords.length})</h4>
                    <div className="keywords-list">
                      {results.matchedKeywords.map((kw, i) => (
                        <span key={i} className="keyword-tag keyword-matched" title={
                          `Category: ${kw.category || '?'} · Priority: ${kw.priority || '?'} · Found as: "${kw.matchedAs || kw.keyword || kw}" · ${kw.occurrences || 1}x`
                        }>
                          {kw.keyword || kw}
                          {kw.priority === 'required' && <span style={{ marginLeft: 4, fontSize: '0.65rem', opacity: 0.7 }}>REQ</span>}
                        </span>
                      ))}
                      {results.matchedKeywords.length === 0 && (
                        <p style={{ color: '#999', fontSize: '0.85rem' }}>No keywords matched.</p>
                      )}
                    </div>
                  </div>

                  {/* Required Missing — highlighted separately */}
                  {results.requiredMissing?.length > 0 && (
                    <div style={{ marginTop: 20 }}>
                      <h4 style={{ marginBottom: 8, color: '#dc2626' }}>Missing REQUIRED Keywords ({results.requiredMissing.length})</h4>
                      <p style={{ fontSize: '0.8rem', color: '#666', marginBottom: 8 }}>
                        Most ATS systems auto-reject if these are missing. Add them to your resume.
                      </p>
                      <div className="keywords-list">
                        {results.requiredMissing.map((kw, i) => (
                          <span key={i} style={{
                            padding: '4px 10px', borderRadius: 14, fontSize: '0.8rem',
                            background: '#fee2e2', color: '#dc2626', fontWeight: 500, border: '1px solid #fecaca'
                          }}>
                            {kw.keyword || kw}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Preferred Missing */}
                  {results.missingKeywords.filter(k => k.priority === 'preferred').length > 0 && (
                    <div style={{ marginTop: 16 }}>
                      <h4 style={{ marginBottom: 8, color: '#d97706' }}>
                        Missing Preferred Keywords ({results.missingKeywords.filter(k => k.priority === 'preferred').length})
                      </h4>
                      <div className="keywords-list">
                        {results.missingKeywords.filter(k => k.priority === 'preferred').map((kw, i) => (
                          <span key={i} className="keyword-tag keyword-missing">
                            {kw.keyword || kw}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Recruiter 6-Second Screen Tab */}
              {activeResultTab === 'recruiter' && (
                <div>
                  {!rs ? (
                    <div className="empty-state">
                      <h3>Recruiter screening unavailable</h3>
                      <p>AI-powered screening requires an Anthropic API key. The ATS keyword scan still works.</p>
                    </div>
                  ) : (
                    <div>
                      {/* Verdict */}
                      <div style={{
                        ...getVerdictStyle(rs.verdict),
                        padding: '16px 20px', borderRadius: 10, marginBottom: 20, textAlign: 'center'
                      }}>
                        <div style={{ fontSize: '1.4rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>
                          {rs.verdict === 'pass' ? 'PASS' : rs.verdict === 'maybe' ? 'MAYBE' : 'REJECT'}
                        </div>
                        <div style={{ fontSize: '0.9rem' }}>{rs.verdictReason}</div>
                      </div>

                      {/* First Impressions */}
                      <div style={{ marginBottom: 20 }}>
                        <h4 style={{ marginBottom: 10 }}>First Impressions (what a recruiter notices)</h4>
                        {rs.firstImpressions?.map((imp, i) => (
                          <div key={i} style={{
                            padding: '8px 12px', background: '#f8fafc', borderRadius: 6,
                            marginBottom: 6, fontSize: '0.9rem', borderLeft: '3px solid #2563eb'
                          }}>
                            {imp}
                          </div>
                        ))}
                      </div>

                      {/* Score Bars */}
                      <div style={{ marginBottom: 20 }}>
                        <h4 style={{ marginBottom: 12 }}>Screening Criteria</h4>
                        {[
                          { label: 'Title Match', data: rs.titleMatch },
                          { label: 'Experience', data: rs.experienceMatch },
                          { label: 'Education', data: rs.educationMatch },
                          { label: 'Impact & Numbers', data: rs.impactCheck },
                          { label: 'Readability', data: rs.readability }
                        ].map(({ label, data }) => data && (
                          <div key={label} style={{ marginBottom: 14 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: '0.85rem' }}>
                              <span style={{ fontWeight: 500 }}>{label}</span>
                              <span style={{ color: '#666' }}>{data.score}/5</span>
                            </div>
                            <div style={{ background: '#e5e7eb', borderRadius: 4, height: 8, overflow: 'hidden' }}>
                              <div style={{
                                width: `${(data.score / 5) * 100}%`,
                                height: '100%',
                                background: getScoreBarColor(data.score),
                                borderRadius: 4,
                                transition: 'width 0.3s'
                              }} />
                            </div>
                            <p style={{ fontSize: '0.8rem', color: '#666', marginTop: 3 }}>{data.comment}</p>
                          </div>
                        ))}
                      </div>

                      {/* Top Suggestions */}
                      {rs.topSuggestions?.length > 0 && (
                        <div style={{ padding: 16, background: '#eff6ff', borderRadius: 8, border: '1px solid #bfdbfe' }}>
                          <h4 style={{ marginBottom: 8, color: '#1d4ed8' }}>Top Changes to Make</h4>
                          <ol style={{ paddingLeft: 20, fontSize: '0.9rem', color: '#1e40af' }}>
                            {rs.topSuggestions.map((s, i) => (
                              <li key={i} style={{ marginBottom: 6 }}>{s}</li>
                            ))}
                          </ol>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Grammar & Design Tab */}
              {activeResultTab === 'grammar' && (
                <div>
                  {!rs ? (
                    <div className="empty-state">
                      <h3>Grammar & design check unavailable</h3>
                      <p>AI-powered analysis requires an Anthropic API key.</p>
                    </div>
                  ) : (
                    <div>
                      {/* Formatting Score */}
                      {rs.formattingScore && (
                        <div style={{ marginBottom: 20 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: '0.9rem' }}>
                            <span style={{ fontWeight: 600 }}>Visual Design Score</span>
                            <span style={{ color: '#666' }}>{rs.formattingScore.score}/5</span>
                          </div>
                          <div style={{ background: '#e5e7eb', borderRadius: 4, height: 10, overflow: 'hidden', marginBottom: 6 }}>
                            <div style={{
                              width: `${(rs.formattingScore.score / 5) * 100}%`, height: '100%',
                              background: rs.formattingScore.score >= 4 ? '#16a34a' : rs.formattingScore.score >= 3 ? '#d97706' : '#dc2626',
                              borderRadius: 4
                            }} />
                          </div>
                          <p style={{ fontSize: '0.8rem', color: '#666' }}>{rs.formattingScore.comment}</p>
                        </div>
                      )}

                      {/* Grammar Errors */}
                      {rs.grammarErrors?.length > 0 ? (
                        <div style={{ marginBottom: 24 }}>
                          <h4 style={{ marginBottom: 10, color: '#dc2626' }}>
                            Grammar & Spelling Errors ({rs.grammarErrors.length})
                          </h4>
                          {rs.grammarErrors.map((err, i) => (
                            <div key={i} style={{
                              padding: '10px 14px', background: '#fef2f2', borderRadius: 6,
                              marginBottom: 8, borderLeft: '3px solid #dc2626'
                            }}>
                              <div style={{ fontSize: '0.85rem', color: '#991b1b', marginBottom: 4 }}>
                                <span style={{ textDecoration: 'line-through', opacity: 0.7 }}>"{err.text}"</span>
                              </div>
                              <div style={{ fontSize: '0.8rem', color: '#666', marginBottom: 4 }}>{err.issue}</div>
                              <div style={{ fontSize: '0.85rem', color: '#16a34a', fontWeight: 500 }}>
                                Fix: "{err.fix}"
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div style={{
                          padding: '12px 16px', background: '#f0fdf4', borderRadius: 8,
                          border: '1px solid #bbf7d0', marginBottom: 20, textAlign: 'center'
                        }}>
                          <span style={{ color: '#16a34a', fontWeight: 500 }}>No grammar errors found</span>
                        </div>
                      )}

                      {/* Formatting Issues */}
                      {rs.formattingIssues?.length > 0 ? (
                        <div style={{ marginBottom: 24 }}>
                          <h4 style={{ marginBottom: 10, color: '#d97706' }}>
                            Formatting & Design Issues ({rs.formattingIssues.length})
                          </h4>
                          <p style={{ fontSize: '0.8rem', color: '#666', marginBottom: 12 }}>
                            Inconsistent formatting makes your resume look unprofessional and harder to scan.
                          </p>
                          {rs.formattingIssues.map((issue, i) => (
                            <div key={i} style={{
                              padding: '10px 14px', background: '#fffbeb', borderRadius: 6,
                              marginBottom: 8, borderLeft: '3px solid #d97706'
                            }}>
                              <div style={{ fontSize: '0.85rem', fontWeight: 500, color: '#92400e', marginBottom: 2 }}>
                                {issue.issue}
                              </div>
                              <div style={{ fontSize: '0.8rem', color: '#666', marginBottom: 2 }}>
                                Location: {issue.location}
                              </div>
                              <div style={{ fontSize: '0.8rem', color: '#1d4ed8' }}>
                                Fix: {issue.fix}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div style={{
                          padding: '12px 16px', background: '#f0fdf4', borderRadius: 8,
                          border: '1px solid #bbf7d0', textAlign: 'center'
                        }}>
                          <span style={{ color: '#16a34a', fontWeight: 500 }}>No formatting issues detected</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Cleanup / Line-by-Line Audit Tab */}
              {activeResultTab === 'cleanup' && (
                <div>
                  {!rs ? (
                    <div className="empty-state">
                      <h3>Cleanup analysis unavailable</h3>
                      <p>AI-powered analysis requires an Anthropic API key.</p>
                    </div>
                  ) : (
                    <div>
                      {/* Audit Summary Stats */}
                      {rs.lineByLineAudit?.length > 0 && (() => {
                        const removeCount = rs.lineByLineAudit.filter(l => l.verdict === 'remove').length;
                        const rewriteCount = rs.lineByLineAudit.filter(l => l.verdict === 'rewrite').length;
                        const keepCount = rs.lineByLineAudit.filter(l => l.verdict === 'keep').length;
                        const total = rs.lineByLineAudit.length;
                        const irrelevantPct = total > 0 ? Math.round(((removeCount + rewriteCount) / total) * 100) : 0;
                        return (
                          <div style={{ marginBottom: 20 }}>
                            <div style={{
                              display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 16
                            }}>
                              <div style={{ background: '#f8fafc', padding: 12, borderRadius: 8, textAlign: 'center' }}>
                                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#333' }}>{total}</div>
                                <div style={{ fontSize: '0.75rem', color: '#666' }}>Lines Audited</div>
                              </div>
                              <div style={{ background: '#dcfce7', padding: 12, borderRadius: 8, textAlign: 'center' }}>
                                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#16a34a' }}>{keepCount}</div>
                                <div style={{ fontSize: '0.75rem', color: '#16a34a' }}>Keep</div>
                              </div>
                              <div style={{ background: '#fef3c7', padding: 12, borderRadius: 8, textAlign: 'center' }}>
                                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#d97706' }}>{rewriteCount}</div>
                                <div style={{ fontSize: '0.75rem', color: '#d97706' }}>Rewrite</div>
                              </div>
                              <div style={{ background: '#fee2e2', padding: 12, borderRadius: 8, textAlign: 'center' }}>
                                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#dc2626' }}>{removeCount}</div>
                                <div style={{ fontSize: '0.75rem', color: '#dc2626' }}>Remove</div>
                              </div>
                            </div>
                            <div style={{
                              padding: '10px 14px', borderRadius: 8, fontSize: '0.85rem', fontWeight: 500, textAlign: 'center',
                              background: irrelevantPct > 50 ? '#fee2e2' : irrelevantPct > 30 ? '#fef3c7' : '#dcfce7',
                              color: irrelevantPct > 50 ? '#dc2626' : irrelevantPct > 30 ? '#d97706' : '#16a34a'
                            }}>
                              {irrelevantPct}% of your resume needs changes for this role
                            </div>
                          </div>
                        );
                      })()}

                      {/* Line-by-Line Audit */}
                      {rs.lineByLineAudit?.length > 0 && (
                        <div style={{ marginBottom: 24 }}>
                          <h4 style={{ marginBottom: 6 }}>Line-by-Line Audit</h4>
                          <p style={{ fontSize: '0.8rem', color: '#666', marginBottom: 12 }}>
                            Every line in your resume scrutinized against this job. Nothing gets a free pass.
                          </p>
                          {rs.lineByLineAudit.map((item, i) => {
                            const borderColor = item.verdict === 'remove' ? '#dc2626' : item.verdict === 'rewrite' ? '#d97706' : '#16a34a';
                            const bgColor = item.verdict === 'remove' ? '#fef2f2' : item.verdict === 'rewrite' ? '#fffbeb' : '#f0fdf4';
                            const badgeBg = item.verdict === 'remove' ? '#fee2e2' : item.verdict === 'rewrite' ? '#fef3c7' : '#dcfce7';
                            const badgeColor = item.verdict === 'remove' ? '#dc2626' : item.verdict === 'rewrite' ? '#d97706' : '#16a34a';
                            const relevanceBg = item.relevance === 'none' ? '#fee2e2' : item.relevance === 'low' ? '#fff1f2' : item.relevance === 'medium' ? '#fef3c7' : '#dcfce7';
                            const relevanceColor = item.relevance === 'none' ? '#dc2626' : item.relevance === 'low' ? '#e11d48' : item.relevance === 'medium' ? '#d97706' : '#16a34a';
                            return (
                              <div key={i} style={{
                                padding: '10px 14px', background: bgColor, borderRadius: 6,
                                marginBottom: 8, borderLeft: `3px solid ${borderColor}`
                              }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                                  <span style={{
                                    fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase',
                                    padding: '2px 8px', borderRadius: 10, background: badgeBg, color: badgeColor
                                  }}>
                                    {item.verdict}
                                  </span>
                                  <span style={{
                                    fontSize: '0.7rem', fontWeight: 500,
                                    padding: '2px 8px', borderRadius: 10, background: relevanceBg, color: relevanceColor
                                  }}>
                                    {item.relevance} relevance
                                  </span>
                                </div>
                                <div style={{
                                  fontSize: '0.85rem', fontWeight: 500, color: '#1a1a2e', marginBottom: 4,
                                  textDecoration: item.verdict === 'remove' ? 'line-through' : 'none',
                                  textDecorationColor: '#dc2626'
                                }}>
                                  "{item.line}"
                                </div>
                                <div style={{ fontSize: '0.8rem', color: '#555' }}>{item.reason}</div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Irrelevant Skills */}
                      {rs.irrelevantSkills?.length > 0 && (
                        <div style={{ marginBottom: 24 }}>
                          <h4 style={{ marginBottom: 10, color: '#d97706' }}>Skills to Remove</h4>
                          <p style={{ fontSize: '0.8rem', color: '#666', marginBottom: 12 }}>
                            These skills waste space and dilute your profile for this role.
                          </p>
                          {rs.irrelevantSkills.map((item, i) => (
                            <div key={i} style={{
                              padding: '8px 14px', background: '#fffbeb', borderRadius: 6,
                              marginBottom: 6, borderLeft: '3px solid #d97706'
                            }}>
                              <span style={{ fontWeight: 600, color: '#92400e', fontSize: '0.85rem' }}>{item.skill}</span>
                              <span style={{ color: '#666', fontSize: '0.8rem' }}> — {item.reason}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Lines to Cut */}
                      {rs.removeToSaveSpace?.length > 0 && (
                        <div style={{ marginBottom: 24 }}>
                          <h4 style={{ marginBottom: 10, color: '#7c3aed' }}>Quick Cuts — Delete These Now</h4>
                          {rs.removeToSaveSpace.map((line, i) => (
                            <div key={i} style={{
                              padding: '8px 14px', background: '#f5f3ff', borderRadius: 6,
                              marginBottom: 6, fontSize: '0.85rem', color: '#5b21b6',
                              borderLeft: '3px solid #7c3aed', textDecoration: 'line-through',
                              textDecorationColor: '#a78bfa'
                            }}>
                              {line}
                            </div>
                          ))}
                        </div>
                      )}

                      {(!rs.lineByLineAudit?.length && !rs.irrelevantSkills?.length && !rs.removeToSaveSpace?.length) && (
                        <div className="empty-state">
                          <h3>Your resume looks clean!</h3>
                          <p>No irrelevant content detected for this role.</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ATSScorer;
