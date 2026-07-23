import React, { useState, useEffect, useRef } from 'react';
import api from '../api';

function ResumeReview({ atsContext, onSwitchToATS, preloadedResume }) {
  const [previewLoading, setPreviewLoading] = useState(false);
  const [compiling, setCompiling] = useState(false);
  const [scoring, setScoring] = useState(false);
  const [changeList, setChangeList] = useState(null);
  const [tailoredTex, setTailoredTex] = useState(null);
  const [texFilename, setTexFilename] = useState('tailored_resume.tex');
  const [changeSummary, setChangeSummary] = useState(null);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [tailoredScore, setTailoredScore] = useState(null);
  const [tailoredDemonstrated, setTailoredDemonstrated] = useState(null);
  const [outreach, setOutreach] = useState(null);
  const [generatingOutreach, setGeneratingOutreach] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState('');
  const [activeTab, setActiveTab] = useState('generate');
  const [enhancing, setEnhancing] = useState(false);
  const [enhanceChanges, setEnhanceChanges] = useState(null);
  const preloadedRef = useRef(null);

  // When preloaded resume data arrives from background ATS scan, consume it immediately
  useEffect(() => {
    if (!preloadedResume || !preloadedResume.tailoredTex) return;
    // Avoid re-processing the same preload
    if (preloadedResume === preloadedRef.current) return;
    preloadedRef.current = preloadedResume;

    setChangeList(preloadedResume.changeList || []);
    setTailoredTex(preloadedResume.tailoredTex);
    setTexFilename(preloadedResume.filename || 'tailored_resume.tex');
    setChangeSummary(preloadedResume.summary);
    setError('');

    // Use pre-compiled PDF and pre-computed score from the stream if available
    if (preloadedResume.pdfBase64) {
      try {
        const binaryStr = atob(preloadedResume.pdfBase64);
        const bytes = new Uint8Array(binaryStr.length);
        for (let i = 0; i < binaryStr.length; i++) bytes[i] = binaryStr.charCodeAt(i);
        const blob = new Blob([bytes], { type: 'application/pdf' });
        setPdfUrl(URL.createObjectURL(blob));
      } catch {}
    }

    if (preloadedResume.tailoredScore != null) {
      setTailoredScore(preloadedResume.tailoredScore);
      setTailoredDemonstrated(preloadedResume.tailoredDemonstrated);
    }

    // If PDF wasn't pre-compiled, compile now; same for score
    const needsPdf = !preloadedResume.pdfBase64;
    const needsScore = preloadedResume.tailoredScore == null;

    if (needsPdf || needsScore) {
      setCompiling(needsPdf);
      setScoring(needsScore);

      const promises = [];
      if (needsPdf) {
        promises.push(
          api.post('/ats/compile-tex', {
            texContent: preloadedResume.tailoredTex,
            filename: preloadedResume.filename || 'tailored_resume',
          }, { responseType: 'blob' }).then(res => {
            const blob = new Blob([res.data], { type: 'application/pdf' });
            setPdfUrl(URL.createObjectURL(blob));
          }).catch(() => {})
        );
      }
      if (needsScore) {
        promises.push(
          api.post('/ats/score-tailored', {
            texContent: preloadedResume.tailoredTex,
            jobDescription: atsContext.jobDescription,
          }).then(res => {
            setTailoredScore(res.data.score);
            setTailoredDemonstrated(res.data.demonstratedScore);
          }).catch(() => {})
        );
      }

      Promise.all(promises).then(() => {
        setCompiling(false);
        setScoring(false);
      });
    }
  }, [preloadedResume, atsContext]);

  if (!atsContext) {
    return (
      <div className="empty-state" style={{ padding: '60px 20px' }}>
        <h3>No ATS scan found</h3>
        <p style={{ marginBottom: 20 }}>
          Run an ATS scan first — it identifies which skills are missing for the role. Then come back here to generate your tailored resume in one click.
        </p>
        <button className="btn btn-primary" onClick={onSwitchToATS}>
          Go to ATS Scanner
        </button>
      </div>
    );
  }

  const scoreColor = atsContext.score >= 70 ? '#16a34a' : atsContext.score >= 40 ? '#d97706' : '#dc2626';
  const scoreBg = atsContext.score >= 70 ? '#dcfce7' : atsContext.score >= 40 ? '#fef3c7' : '#fee2e2';

  const handlePreview = async () => {
    setPreviewLoading(true);
    setError('');
    setChangeList(null);
    setTailoredTex(null);
    setChangeSummary(null);
    setPdfUrl(null);
    setTailoredScore(null);
    setTailoredDemonstrated(null);

    try {
      const { data } = await api.post('/ats/preview-tex', {
        jobDescription: atsContext.jobDescription,
        company: atsContext.company,
        position: atsContext.position,
        linesToRemove: atsContext.linesToRemove || [],
        skillsToRemove: atsContext.skillsToRemove || [],
        missingRequired: atsContext.missingRequired || [],
        missingPreferred: atsContext.missingPreferred || [],
        transferableSkills: atsContext.transferableSkills || [],
      });
      setChangeList(data.changeList || []);
      setTailoredTex(data.tailoredTex);
      setTexFilename(data.filename || 'tailored_resume.tex');
      setChangeSummary(data.summary);

      if (data.tailoredTex) {
        // Score the tailored resume + compile PDF in parallel
        setCompiling(true);
        setScoring(true);

        const pdfPromise = api.post('/ats/compile-tex', {
          texContent: data.tailoredTex,
          filename: data.filename || 'tailored_resume',
        }, { responseType: 'blob' }).then(res => {
          const blob = new Blob([res.data], { type: 'application/pdf' });
          setPdfUrl(URL.createObjectURL(blob));
        }).catch(() => {});

        const scorePromise = api.post('/ats/score-tailored', {
          texContent: data.tailoredTex,
          jobDescription: atsContext.jobDescription,
        }).then(res => {
          setTailoredScore(res.data.score);
          setTailoredDemonstrated(res.data.demonstratedScore);
        }).catch(() => {});

        await Promise.all([pdfPromise, scorePromise]);
        setCompiling(false);
        setScoring(false);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to generate preview');
    } finally {
      setPreviewLoading(false);
      setCompiling(false);
      setScoring(false);
    }
  };

  const handleEnhance = async () => {
    if (!tailoredTex || !atsContext) return;
    setEnhancing(true);
    setError('');
    setEnhanceChanges(null);
    try {
      const { data } = await api.post('/ats/enhance-tex', {
        texContent: tailoredTex,
        jobDescription: atsContext.jobDescription,
        missingRequired: atsContext.missingRequired || [],
        missingPreferred: atsContext.missingPreferred || [],
      });
      if (data.enhancedTex) {
        setTailoredTex(data.enhancedTex);
        setEnhanceChanges(data.changes);
        // Re-compile PDF with enhanced tex
        setCompiling(true);
        try {
          const pdfRes = await api.post('/ats/compile-tex', {
            texContent: data.enhancedTex,
            filename: texFilename.replace(/\.tex$/, ''),
          }, { responseType: 'blob' });
          if (pdfUrl) URL.revokeObjectURL(pdfUrl);
          const blob = new Blob([pdfRes.data], { type: 'application/pdf' });
          setPdfUrl(URL.createObjectURL(blob));
        } catch {}
        setCompiling(false);
        // Re-score
        if (data.newScore) {
          setTailoredScore(data.newScore.score);
          setTailoredDemonstrated(data.newScore.demonstratedScore);
        }
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Enhancement failed');
    } finally {
      setEnhancing(false);
    }
  };

  const handleDownloadTex = () => {
    if (!tailoredTex) return;
    const blob = new Blob([tailoredTex], { type: 'application/x-tex' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = texFilename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadPdf = () => {
    if (!pdfUrl) return;
    const a = document.createElement('a');
    a.href = pdfUrl;
    a.download = texFilename.replace(/\.tex$/, '.pdf');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleDiscard = () => {
    if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    setChangeList(null);
    setTailoredTex(null);
    setChangeSummary(null);
    setPdfUrl(null);
    setTailoredScore(null);
    setTailoredDemonstrated(null);
    setError('');
  };

  const handleGenerateOutreach = async () => {
    setGeneratingOutreach(true);
    setError('');
    try {
      const { data } = await api.post('/ats/outreach', {
        jobDescription: atsContext.jobDescription,
        company: atsContext.company,
        position: atsContext.position,
      });
      setOutreach(data);
      setActiveTab('outreach');
    } catch (err) {
      setError(err.response?.data?.error || 'Outreach generation failed');
    } finally {
      setGeneratingOutreach(false);
    }
  };

  const copyToClipboard = async (text, key) => {
    await navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(''), 2000);
  };

  const tabBtn = (key, label) => (
    <button
      onClick={() => setActiveTab(key)}
      style={{
        padding: '10px 20px', border: 'none', background: 'none', cursor: 'pointer',
        fontWeight: activeTab === key ? 600 : 400,
        color: activeTab === key ? '#2563eb' : '#666',
        borderBottom: activeTab === key ? '2px solid #2563eb' : '2px solid transparent',
        marginBottom: -2, fontSize: '0.95rem'
      }}
    >
      {label}
    </button>
  );

  return (
    <div>
      <h2 style={{ marginBottom: 8 }}>Generate Resume</h2>

      {/* ATS context banner */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 16, padding: '12px 16px',
        background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, marginBottom: 20
      }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, color: '#1a1a2e', fontSize: '0.95rem' }}>
            {atsContext.company || 'Company'} — {atsContext.position || 'Position'}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#666', marginTop: 2 }}>
            {atsContext.missingRequired?.length || 0} required skills missing ·{' '}
            {atsContext.missingPreferred?.length || 0} preferred skills missing
          </div>
        </div>
        <div style={{ padding: '8px 14px', borderRadius: 8, background: scoreBg, color: scoreColor, fontWeight: 700, fontSize: '1.1rem', textAlign: 'center' }}>
          {atsContext.score}%
          <div style={{ fontSize: '0.65rem', fontWeight: 400 }}>Original ATS</div>
        </div>
        <div style={{ padding: '8px 14px', borderRadius: 8, background: '#ecfeff', color: '#0e7490', fontWeight: 700, fontSize: '1.1rem', textAlign: 'center', border: '1px solid #a5f3fc' }}>
          {typeof atsContext.demonstratedScore === 'number' ? atsContext.demonstratedScore : atsContext.score}%
          <div style={{ fontSize: '0.65rem', fontWeight: 400 }}>Demonstrated</div>
        </div>
        <button
          className="btn btn-secondary"
          style={{ fontSize: '0.8rem', padding: '6px 12px' }}
          onClick={onSwitchToATS}
        >
          Re-scan
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '2px solid #e1e5eb', marginBottom: 24 }}>
        {tabBtn('generate', 'Generate Resume')}
        {outreach && tabBtn('outreach', 'Outreach')}
      </div>

      {/* Generate Tab */}
      {activeTab === 'generate' && (
        <div>
          <p style={{ fontSize: '0.85rem', color: '#555', marginBottom: 16, lineHeight: 1.6, maxWidth: 600 }}>
            Uses your master resume (main.tex). The AI will remove irrelevant bullets, prune skills, and
            trim each role — <strong>no text is ever reworded</strong>. Review the changes and preview below.
          </p>

          {/* Step 1: Generate button — skip if preloaded data already loaded */}
          {!changeList && (
            <div style={{ marginBottom: 20 }}>
              {preloadedResume ? (
                <div style={{
                  padding: '14px 18px', borderRadius: 10,
                  background: '#f0fdf4', border: '1px solid #bbf7d0'
                }}>
                  <div style={{ fontWeight: 600, color: '#166534', fontSize: '0.95rem', marginBottom: 4 }}>
                    Resume pre-generated from ATS scan
                  </div>
                  <div style={{ fontSize: '0.82rem', color: '#555' }}>
                    Tailored resume was built in the background while you reviewed ATS results. Loading now...
                  </div>
                </div>
              ) : (
                <>
                  <button
                    className="btn btn-primary"
                    onClick={handlePreview}
                    disabled={previewLoading}
                    style={{ minWidth: 200 }}
                  >
                    {previewLoading ? 'Analyzing master resume...' : 'Generate Tailored Resume'}
                  </button>
                  {previewLoading && (
                    <p style={{ fontSize: '0.8rem', color: '#888', marginTop: 8 }}>
                      AI is reading your master resume, comparing against the JD, and selecting the best bullets...
                    </p>
                  )}
                </>
              )}
            </div>
          )}

          {/* Step 2: Change list + PDF preview */}
          {changeList && (
            <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>
              {/* Left: changes + actions */}
              <div style={{ flex: '1 1 340px', minWidth: 320 }}>
                {/* Score comparison */}
                <div style={{
                  padding: '14px 18px', borderRadius: 10, marginBottom: 16,
                  background: '#f0fdf4', border: '1px solid #bbf7d0'
                }}>
                  <h4 style={{ margin: '0 0 10px 0', color: '#166534', fontSize: '0.95rem' }}>
                    ATS Score Comparison
                  </h4>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{
                        padding: '6px 14px', borderRadius: 8, fontWeight: 700, fontSize: '1.2rem',
                        background: scoreBg, color: scoreColor
                      }}>
                        {atsContext.score}%
                      </div>
                      <div style={{ fontSize: '0.7rem', color: '#666', marginTop: 2 }}>Original</div>
                    </div>
                    <div style={{ fontSize: '1.2rem', color: '#9ca3af' }}>→</div>
                    <div style={{ textAlign: 'center' }}>
                      {scoring ? (
                        <div style={{
                          padding: '6px 14px', borderRadius: 8, fontSize: '0.85rem',
                          background: '#f1f5f9', color: '#888'
                        }}>
                          Scoring...
                        </div>
                      ) : tailoredScore != null ? (
                        <div style={{
                          padding: '6px 14px', borderRadius: 8, fontWeight: 700, fontSize: '1.2rem',
                          background: tailoredScore >= 70 ? '#dcfce7' : tailoredScore >= 40 ? '#fef3c7' : '#fee2e2',
                          color: tailoredScore >= 70 ? '#16a34a' : tailoredScore >= 40 ? '#d97706' : '#dc2626'
                        }}>
                          {tailoredScore}%
                        </div>
                      ) : (
                        <div style={{
                          padding: '6px 14px', borderRadius: 8, fontSize: '0.85rem',
                          background: '#f1f5f9', color: '#888'
                        }}>
                          —
                        </div>
                      )}
                      <div style={{ fontSize: '0.7rem', color: '#666', marginTop: 2 }}>Tailored</div>
                    </div>
                    {tailoredScore != null && (
                      <div style={{
                        padding: '4px 10px', borderRadius: 8, fontSize: '0.8rem', fontWeight: 600,
                        background: tailoredScore > atsContext.score ? '#dcfce7' : tailoredScore < atsContext.score ? '#fee2e2' : '#f1f5f9',
                        color: tailoredScore > atsContext.score ? '#16a34a' : tailoredScore < atsContext.score ? '#dc2626' : '#666'
                      }}>
                        {tailoredScore > atsContext.score ? '+' : ''}{tailoredScore - atsContext.score}%
                      </div>
                    )}
                  </div>
                </div>

                <div style={{
                  padding: '14px 18px', borderRadius: 10, marginBottom: 16,
                  background: '#eff6ff', border: '1px solid #bfdbfe'
                }}>
                  <h4 style={{ margin: '0 0 10px 0', color: '#1d4ed8', fontSize: '0.95rem' }}>
                    Proposed Changes ({changeList.length} total)
                  </h4>
                  {changeSummary && (
                    <div style={{ display: 'flex', gap: 16, marginBottom: 10, fontSize: '0.85rem' }}>
                      {changeSummary.removed > 0 && (
                        <span style={{ color: '#dc2626' }}>
                          <strong>{changeSummary.removed}</strong> lines removed
                        </span>
                      )}
                      {changeSummary.pruned > 0 && (
                        <span style={{ color: '#d97706' }}>
                          <strong>{changeSummary.pruned}</strong> skills pruned
                        </span>
                      )}
                      {changeSummary.trimmed > 0 && (
                        <span style={{ color: '#7c3aed' }}>
                          <strong>{changeSummary.trimmed}</strong> bullets trimmed
                        </span>
                      )}
                    </div>
                  )}
                  <p style={{ fontSize: '0.78rem', color: '#666', margin: 0 }}>
                    All changes are removals only — no text was reworded or added.
                  </p>
                </div>

                {/* Detailed change list */}
                <div style={{ maxHeight: 300, overflowY: 'auto', marginBottom: 16 }}>
                  {changeList.map((change, i) => {
                    const typeColors = {
                      removed_bullet: { bg: '#fef2f2', border: '#fecaca', label: '#dc2626', text: 'Removed' },
                      pruned_skill: { bg: '#fffbeb', border: '#fde68a', label: '#d97706', text: 'Pruned' },
                      trimmed_bullet: { bg: '#f5f3ff', border: '#ddd6fe', label: '#7c3aed', text: 'Trimmed' },
                    };
                    const style = typeColors[change.type] || typeColors.removed_bullet;
                    return (
                      <div key={i} style={{
                        padding: '8px 12px', background: style.bg, borderRadius: 6,
                        marginBottom: 6, borderLeft: `3px solid ${style.border}`, fontSize: '0.82rem'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                          <span style={{
                            fontSize: '0.68rem', fontWeight: 600, textTransform: 'uppercase',
                            padding: '1px 6px', borderRadius: 8, background: style.border, color: style.label
                          }}>
                            {style.text}
                          </span>
                          <span style={{ color: '#666', fontSize: '0.76rem' }}>{change.reason}</span>
                        </div>
                        <div style={{ color: '#374151', lineHeight: 1.4 }}>
                          "{change.content.length > 120 ? change.content.substring(0, 120) + '...' : change.content}"
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Action buttons */}
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <button className="btn btn-primary" onClick={handleDownloadTex} style={{ minWidth: 140 }}>
                    Download .tex
                  </button>
                  {pdfUrl && (
                    <button className="btn btn-primary" onClick={handleDownloadPdf} style={{ minWidth: 140 }}>
                      Download PDF
                    </button>
                  )}
                  <button
                    className="btn btn-success"
                    onClick={handleEnhance}
                    disabled={enhancing}
                    style={{ minWidth: 180, background: '#7c3aed', borderColor: '#7c3aed' }}
                  >
                    {enhancing ? 'Adding keywords...' : 'Add Missing Keywords'}
                  </button>
                  <button className="btn btn-secondary" onClick={handleDiscard}>
                    Discard
                  </button>
                  <button
                    className="btn btn-secondary"
                    onClick={handleGenerateOutreach}
                    disabled={generatingOutreach}
                  >
                    {generatingOutreach ? 'Generating...' : 'Generate Outreach'}
                  </button>
                </div>

                {/* Enhancement results */}
                {enhanceChanges && (
                  <div style={{
                    marginTop: 16, padding: '14px 18px', borderRadius: 10,
                    background: '#faf5ff', border: '1px solid #d8b4fe'
                  }}>
                    <h4 style={{ margin: '0 0 8px 0', color: '#6b21a8', fontSize: '0.95rem' }}>
                      Keywords Added ({(enhanceChanges.addedSkills?.length || 0) + (enhanceChanges.newBullets?.length || 0)})
                    </h4>
                    {enhanceChanges.addedSkills?.length > 0 && (
                      <div style={{ marginBottom: 8 }}>
                        <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#7c3aed', marginBottom: 4 }}>Skills added:</div>
                        {enhanceChanges.addedSkills.map((s, i) => (
                          <div key={i} style={{ fontSize: '0.82rem', color: '#374151', marginBottom: 2 }}>
                            <span style={{ fontWeight: 600 }}>+ {s.skill}</span>
                            <span style={{ color: '#888' }}> — {s.location}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {enhanceChanges.newBullets?.length > 0 && (
                      <div>
                        <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#7c3aed', marginBottom: 4 }}>New bullets:</div>
                        {enhanceChanges.newBullets.map((b, i) => (
                          <div key={i} style={{ fontSize: '0.82rem', color: '#374151', marginBottom: 2 }}>
                            <span style={{ fontWeight: 600 }}>{b.role}:</span> "{b.bullet}"
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

              </div>
              <div style={{ flex: '1 1 400px', minWidth: 360 }}>
                {compiling && (
                  <div style={{
                    padding: '40px 20px', textAlign: 'center', background: '#f8fafc',
                    border: '2px dashed #e2e8f0', borderRadius: 10, color: '#888', fontSize: '0.85rem'
                  }}>
                    Compiling preview...
                  </div>
                )}
                {pdfUrl && (
                  <div style={{
                    border: '1px solid #e2e8f0', borderRadius: 10, overflow: 'hidden',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
                  }}>
                    <div style={{
                      padding: '8px 14px', background: '#f1f5f9', borderBottom: '1px solid #e2e8f0',
                      fontSize: '0.78rem', color: '#666', display: 'flex', justifyContent: 'space-between'
                    }}>
                      <span>Preview</span>
                      <span>{texFilename}</span>
                    </div>
                    <iframe
                      src={pdfUrl}
                      title="Resume preview"
                      style={{ width: '100%', height: 600, border: 'none' }}
                    />
                  </div>
                )}
                {!compiling && !pdfUrl && changeList && (
                  <div style={{
                    padding: '40px 20px', textAlign: 'center', background: '#f8fafc',
                    border: '2px dashed #e2e8f0', borderRadius: 10, color: '#888', fontSize: '0.85rem'
                  }}>
                    PDF preview unavailable — download the .tex to view locally.
                  </div>
                )}
              </div>
            </div>
          )}

          {error && <div className="error-message" style={{ marginTop: 12 }}>{error}</div>}

          {!changeList && !previewLoading && (
            <div style={{
              marginTop: 20, padding: '14px 18px', background: '#f8fafc', borderRadius: 8,
              border: '1px solid #e2e8f0'
            }}>
              <h4 style={{ margin: '0 0 8px 0', fontSize: '0.9rem', color: '#374151' }}>
                How it works
              </h4>
              <ol style={{ margin: 0, paddingLeft: 18, fontSize: '0.82rem', color: '#555', lineHeight: 1.7 }}>
                <li>AI reads your master resume (server/templates/main.tex)</li>
                <li>Cross-references against the JD and ATS feedback</li>
                <li>Removes low-relevance bullets, prunes irrelevant skills, trims per role</li>
                <li>Reviews the proposed removals</li>
                <li>Compiles and shows the PDF preview inline</li>
              </ol>
            </div>
          )}
        </div>
      )}

      {/* Outreach Tab */}
      {activeTab === 'outreach' && outreach && (
        <div>
          {outreach.hm_email_subject && (
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <h4 style={{ margin: 0 }}>Email to Hiring Manager</h4>
                <span style={{ fontSize: '0.7rem', background: '#ede9fe', color: '#7c3aed', padding: '2px 8px', borderRadius: 10, fontWeight: 500 }}>Value-focused</span>
              </div>
              <div style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <label style={{ fontWeight: 600, fontSize: '0.82rem', color: '#374151' }}>Subject</label>
                  <button className="btn btn-secondary" style={{ padding: '2px 10px', fontSize: '0.76rem' }} onClick={() => copyToClipboard(outreach.hm_email_subject, 'hm_sub')}>
                    {copied === 'hm_sub' ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 6, padding: '8px 12px', fontSize: '0.9rem', fontWeight: 500 }}>
                  {outreach.hm_email_subject}
                </div>
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <label style={{ fontWeight: 600, fontSize: '0.82rem', color: '#374151' }}>Body</label>
                  <button className="btn btn-secondary" style={{ padding: '2px 10px', fontSize: '0.76rem' }} onClick={() => copyToClipboard(outreach.hm_email_body, 'hm_body')}>
                    {copied === 'hm_body' ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 6, padding: '10px 14px', fontSize: '0.88rem', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                  {outreach.hm_email_body}
                </div>
              </div>
            </div>
          )}

          {outreach.recruiter_email_subject && (
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <h4 style={{ margin: 0 }}>Email to Recruiter</h4>
                <span style={{ fontSize: '0.7rem', background: '#dbeafe', color: '#1d4ed8', padding: '2px 8px', borderRadius: 10, fontWeight: 500 }}>Qualification-aligned</span>
              </div>
              <div style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <label style={{ fontWeight: 600, fontSize: '0.82rem', color: '#374151' }}>Subject</label>
                  <button className="btn btn-secondary" style={{ padding: '2px 10px', fontSize: '0.76rem' }} onClick={() => copyToClipboard(outreach.recruiter_email_subject, 'rec_sub')}>
                    {copied === 'rec_sub' ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 6, padding: '8px 12px', fontSize: '0.9rem', fontWeight: 500 }}>
                  {outreach.recruiter_email_subject}
                </div>
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <label style={{ fontWeight: 600, fontSize: '0.82rem', color: '#374151' }}>Body</label>
                  <button className="btn btn-secondary" style={{ padding: '2px 10px', fontSize: '0.76rem' }} onClick={() => copyToClipboard(outreach.recruiter_email_body, 'rec_body')}>
                    {copied === 'rec_body' ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 6, padding: '10px 14px', fontSize: '0.88rem', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                  {outreach.recruiter_email_body}
                </div>
              </div>
            </div>
          )}

          {outreach.linkedin_message && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <h4 style={{ margin: 0 }}>LinkedIn Message</h4>
                <span style={{ fontSize: '0.7rem', background: '#f0fdf4', color: '#16a34a', padding: '2px 8px', borderRadius: 10, fontWeight: 500 }}>Connection request</span>
                <button className="btn btn-secondary" style={{ padding: '2px 10px', fontSize: '0.76rem', marginLeft: 'auto' }} onClick={() => copyToClipboard(outreach.linkedin_message, 'li')}>
                  {copied === 'li' ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 6, padding: '10px 14px', fontSize: '0.9rem', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                {outreach.linkedin_message}
              </div>
              <div style={{ fontSize: '0.75rem', marginTop: 4, color: outreach.linkedin_message.length > 300 ? '#ef4444' : '#6b7280' }}>
                {outreach.linkedin_message.length}/300 chars
              </div>
            </div>
          )}

          <button className="btn btn-success" onClick={handleGenerateOutreach} disabled={generatingOutreach}>
            {generatingOutreach ? 'Regenerating...' : 'Regenerate Outreach'}
          </button>
        </div>
      )}
    </div>
  );
}

export default ResumeReview;
