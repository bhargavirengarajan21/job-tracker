import React, { useState } from 'react';
import api from '../api';

const SOFT_SKILL_VERBS = {
  communication:      ['Presented', 'Conveyed', 'Articulated', 'Facilitated', 'Briefed', 'Negotiated', 'Liaised', 'Corresponded'],
  leadership:         ['Led', 'Directed', 'Mentored', 'Spearheaded', 'Championed', 'Motivated', 'Guided', 'Empowered'],
  teamwork:           ['Collaborated', 'Partnered', 'Coordinated', 'Contributed', 'Unified', 'Supported', 'Integrated', 'Aligned'],
  collaboration:      ['Collaborated', 'Partnered', 'Coordinated', 'Contributed', 'Unified', 'Supported', 'Integrated', 'Aligned'],
  'problem solving':  ['Resolved', 'Diagnosed', 'Troubleshot', 'Engineered', 'Devised', 'Streamlined', 'Optimized', 'Mitigated'],
  'problem-solving':  ['Resolved', 'Diagnosed', 'Troubleshot', 'Engineered', 'Devised', 'Streamlined', 'Optimized', 'Mitigated'],
  adaptability:       ['Pivoted', 'Adapted', 'Transitioned', 'Overhauled', 'Revamped', 'Restructured', 'Adjusted', 'Flexed'],
  flexibility:        ['Pivoted', 'Adapted', 'Transitioned', 'Adjusted', 'Revamped', 'Restructured', 'Overhauled', 'Flexed'],
  'time management':  ['Prioritized', 'Executed', 'Delivered', 'Scheduled', 'Expedited', 'Managed', 'Completed', 'Met'],
  'critical thinking':['Evaluated', 'Assessed', 'Synthesized', 'Investigated', 'Forecasted', 'Interpreted', 'Examined', 'Analyzed'],
  analytical:         ['Analyzed', 'Evaluated', 'Assessed', 'Synthesized', 'Forecasted', 'Interpreted', 'Examined', 'Modeled'],
  creativity:         ['Pioneered', 'Innovated', 'Conceptualized', 'Designed', 'Created', 'Introduced', 'Developed', 'Crafted'],
  innovation:         ['Pioneered', 'Innovated', 'Conceptualized', 'Launched', 'Introduced', 'Engineered', 'Transformed', 'Reimagined'],
  'attention to detail': ['Audited', 'Validated', 'Verified', 'Reviewed', 'Ensured', 'Inspected', 'Monitored', 'Proofread'],
  mentoring:          ['Mentored', 'Coached', 'Trained', 'Guided', 'Developed', 'Onboarded', 'Advised', 'Nurtured'],
  coaching:           ['Coached', 'Mentored', 'Trained', 'Guided', 'Developed', 'Advised', 'Empowered', 'Nurtured'],
  organization:       ['Organized', 'Systematized', 'Cataloged', 'Consolidated', 'Restructured', 'Coordinated', 'Maintained', 'Streamlined'],
  'conflict resolution': ['Mediated', 'Reconciled', 'Resolved', 'De-escalated', 'Facilitated', 'Arbitrated', 'Negotiated', 'Settled'],
  negotiation:        ['Negotiated', 'Mediated', 'Brokered', 'Secured', 'Persuaded', 'Arbitrated', 'Facilitated', 'Settled'],
  initiative:         ['Initiated', 'Launched', 'Established', 'Proposed', 'Drove', 'Volunteered', 'Pioneered', 'Championed'],
  'self-motivated':   ['Initiated', 'Drove', 'Launched', 'Established', 'Proposed', 'Volunteered', 'Pioneered', 'Championed'],
  planning:           ['Planned', 'Strategized', 'Designed', 'Architected', 'Formulated', 'Mapped', 'Forecasted', 'Orchestrated'],
  strategy:           ['Strategized', 'Architected', 'Formulated', 'Designed', 'Planned', 'Orchestrated', 'Envisioned', 'Shaped'],
  'customer focus':   ['Supported', 'Assisted', 'Resolved', 'Engaged', 'Retained', 'Satisfied', 'Addressed', 'Cultivated'],
  'customer service': ['Supported', 'Assisted', 'Resolved', 'Engaged', 'Retained', 'Satisfied', 'Addressed', 'Cultivated'],
  interpersonal:      ['Built', 'Cultivated', 'Fostered', 'Strengthened', 'Established', 'Developed', 'Maintained', 'Nurtured'],
  'cross-functional': ['Aligned', 'Integrated', 'Bridged', 'Unified', 'Coordinated', 'Partnered', 'Collaborated', 'Facilitated'],
  presentation:       ['Presented', 'Delivered', 'Demonstrated', 'Showcased', 'Pitched', 'Illustrated', 'Communicated', 'Briefed'],
  'decision making':  ['Determined', 'Approved', 'Recommended', 'Evaluated', 'Prioritized', 'Selected', 'Authorized', 'Directed'],
  'work ethic':       ['Delivered', 'Executed', 'Completed', 'Maintained', 'Sustained', 'Committed', 'Upheld', 'Exceeded'],
  empathy:            ['Supported', 'Advocated', 'Engaged', 'Listened', 'Cultivated', 'Fostered', 'Assisted', 'Connected'],
  'active listening': ['Gathered', 'Synthesized', 'Incorporated', 'Responded', 'Assessed', 'Clarified', 'Identified', 'Documented'],
};

function getActionWords(softSkills) {
  if (!softSkills?.length) return [];
  const seen = new Set();
  return softSkills.flatMap(skill => {
    const key = skill.toLowerCase();
    for (const [pattern, verbs] of Object.entries(SOFT_SKILL_VERBS)) {
      if (key.includes(pattern) || pattern.includes(key)) {
        return [{ skill, verbs: verbs.filter(v => !seen.has(v) && seen.add(v)) }];
      }
    }
    return [];
  }).filter(item => item.verbs.length > 0);
}

function ResumeReview({ atsContext, onSwitchToATS }) {
  const [masterResume, setMasterResume] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [changeLog, setChangeLog] = useState(null);
  const [outreach, setOutreach] = useState(null);
  const [generatingOutreach, setGeneratingOutreach] = useState(false);
  const [addingApp, setAddingApp] = useState(false);
  const [appAdded, setAppAdded] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState('');
  const [activeTab, setActiveTab] = useState('generate');

  // No ATS scan done yet
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

  const handleGenerate = async () => {
    if (!masterResume) { setError('Please upload your master resume (DOCX recommended)'); return; }
    setGenerating(true);
    setError('');
    setChangeLog(null);
    setAppAdded(false);

    // Fold "demonstrated but keyword missing" skills into what gets added to the resume —
    // required ones are already in missingRequired; add the preferred ones to missingPreferred
    // (dedup by keyword) so the literal term lands in the skills section for a strict ATS.
    const preferredKeys = new Set((atsContext.missingPreferred || []).map(k => (k.keyword || k || '').toLowerCase()));
    const demonstratedPreferred = (atsContext.demonstratedMissing || [])
      .filter(k => k.priority !== 'required' && !preferredKeys.has((k.keyword || '').toLowerCase()));
    const missingPreferredMerged = [...(atsContext.missingPreferred || []), ...demonstratedPreferred];

    const formData = new FormData();
    formData.append('resume', masterResume);
    formData.append('company', atsContext.company || '');
    formData.append('position', atsContext.position || '');
    formData.append('missingRequiredJson', JSON.stringify(atsContext.missingRequired || []));
    formData.append('missingPreferredJson', JSON.stringify(missingPreferredMerged));
    formData.append('linesToRemoveJson', JSON.stringify(atsContext.linesToRemove || []));
    formData.append('skillsToRemoveJson', JSON.stringify(atsContext.skillsToRemove || []));
    formData.append('grammarFixesJson', JSON.stringify(atsContext.grammarFixes || []));
    // Pass JD as fallback in case keywords are empty
    if (atsContext.jobDescription) formData.append('jobDescription', atsContext.jobDescription);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/ats/generate', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });

      if (!response.ok) {
        const text = await response.text();
        try { setError(JSON.parse(text).error || 'Generation failed'); }
        catch { setError('Generation failed'); }
        return;
      }

      const blob = await response.blob();
      const logHeader = response.headers.get('x-change-log');
      // Server URI-encodes this header (it may contain →, —, etc. that are illegal in headers).
      const decodeLog = (h) => { try { return JSON.parse(decodeURIComponent(h)); } catch { try { return JSON.parse(h); } catch { return []; } } };
      setChangeLog(logHeader ? decodeLog(logHeader) : []);

      const filename = [atsContext.company, atsContext.position, 'resume']
        .filter(Boolean).join('_').replace(/\s+/g, '_') || 'tailored_resume';
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filename}.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError('Generation failed: ' + err.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleGenerateOutreach = async () => {
    setGeneratingOutreach(true);
    setError('');
    try {
      const { data } = await api.post('/ats/outreach', {
        jobDescription: atsContext.jobDescription,
        company: atsContext.company,
        position: atsContext.position
      });
      setOutreach(data);
      setActiveTab('outreach');
    } catch (err) {
      setError(err.response?.data?.error || 'Outreach generation failed');
    } finally {
      setGeneratingOutreach(false);
    }
  };

  const handleAddToApplications = async () => {
    setAddingApp(true);
    try {
      await api.post('/applications', {
        company: atsContext.company || 'Unknown',
        position: atsContext.position || 'Unknown',
        status: 'applied',
        ats_score: atsContext.score || '',
        job_url: '',
        notes: `ATS Score: ${atsContext.score || 'N/A'}%. Generated tailored resume.`
      });
      setAppAdded(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add application');
    } finally {
      setAddingApp(false);
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
        <div style={{ maxWidth: 520 }}>
          {/* Missing skills preview */}
          {atsContext.missingRequired?.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <p style={{ fontSize: '0.85rem', color: '#374151', fontWeight: 500, marginBottom: 8 }}>
                These required skills will be added to your resume's skills section:
              </p>
              <div className="keywords-list">
                {atsContext.missingRequired.map((kw, i) => (
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

          {atsContext.missingRequired?.length === 0 && (
            <div style={{ padding: '10px 14px', background: '#f0fdf4', borderRadius: 8, border: '1px solid #bbf7d0', marginBottom: 20, fontSize: '0.85rem', color: '#16a34a' }}>
              No required skills missing — your resume already covers this role.
            </div>
          )}

          {/* Demonstrated but keyword missing — literal terms to add so a strict ATS credits them */}
          {atsContext.demonstratedMissing?.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <p style={{ fontSize: '0.85rem', color: '#374151', fontWeight: 500, marginBottom: 6 }}>
                You <em>demonstrate</em> these, but the literal keyword is missing — the exact term will be added so a strict ATS credits you:
              </p>
              <div className="keywords-list">
                {atsContext.demonstratedMissing.map((kw, i) => (
                  <span key={i} title={kw.matchedAs ? `Demonstrated via "${kw.matchedAs}"` : ''} style={{
                    padding: '4px 10px', borderRadius: 14, fontSize: '0.8rem',
                    background: '#fffbeb', color: '#92400e', fontWeight: 500, border: '1px solid #fde68a'
                  }}>
                    {kw.keyword || kw}
                    {kw.priority === 'required' && <span style={{ marginLeft: 4, fontSize: '0.62rem', fontWeight: 700, opacity: 0.8 }}>REQ</span>}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Irrelevant skills to remove preview */}
          {atsContext.skillsToRemove?.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <p style={{ fontSize: '0.85rem', color: '#374151', fontWeight: 500, marginBottom: 6 }}>
                Skills that will be stripped from your skills section (don't add value for this role):
              </p>
              <div className="keywords-list">
                {atsContext.skillsToRemove.map((skill, i) => (
                  <span key={i} style={{
                    padding: '4px 10px', borderRadius: 14, fontSize: '0.8rem',
                    background: '#fff1f2', color: '#dc2626', fontWeight: 500,
                    border: '1px solid #fecaca', textDecoration: 'line-through'
                  }}>
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Lines to remove preview */}
          {atsContext.linesToRemove?.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <p style={{ fontSize: '0.85rem', color: '#374151', fontWeight: 500, marginBottom: 6 }}>
                Lines that will be removed (irrelevant / no value for this role):
              </p>
              {atsContext.linesToRemove.map((line, i) => (
                <div key={i} style={{ fontSize: '0.78rem', color: '#dc2626', background: '#fff1f2', border: '1px solid #fecaca', borderRadius: 6, padding: '4px 10px', marginBottom: 4 }}>
                  {line.length > 100 ? line.substring(0, 100) + '…' : line}
                </div>
              ))}
            </div>
          )}

          {/* Grammar fixes preview */}
          {atsContext.grammarFixes?.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <p style={{ fontSize: '0.85rem', color: '#374151', fontWeight: 500, marginBottom: 6 }}>
                Grammar fixes that will be applied ({atsContext.grammarFixes.length}):
              </p>
              {atsContext.grammarFixes.slice(0, 5).map((fix, i) => (
                <div key={i} style={{ fontSize: '0.78rem', color: '#92400e', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 6, padding: '4px 10px', marginBottom: 4 }}>
                  <span style={{ textDecoration: 'line-through', marginRight: 6 }}>{fix.text || fix.original}</span>
                  → {fix.fix || fix.corrected}
                </div>
              ))}
              {atsContext.grammarFixes.length > 5 && (
                <div style={{ fontSize: '0.75rem', color: '#92400e' }}>+{atsContext.grammarFixes.length - 5} more fixes</div>
              )}
            </div>
          )}

          {/* Action words for soft skills */}
          {(() => {
            const actionWords = getActionWords(atsContext.softSkills);
            return actionWords.length > 0 ? (
              <div style={{ marginBottom: 20 }}>
                <p style={{ fontSize: '0.85rem', color: '#374151', fontWeight: 500, marginBottom: 8 }}>
                  Action words for soft skills in this JD:
                </p>
                {actionWords.map(({ skill, verbs }) => (
                  <div key={skill} style={{ marginBottom: 10 }}>
                    <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#1e40af', marginBottom: 4, textTransform: 'capitalize' }}>
                      {skill}
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                      {verbs.map(v => (
                        <span key={v} style={{
                          padding: '3px 10px', borderRadius: 12, fontSize: '0.77rem',
                          background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', fontWeight: 500
                        }}>{v}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : null;
          })()}

          <div className="form-group">
            <label>Upload Master Resume</label>
            <p style={{ fontSize: '0.76rem', color: '#888', marginBottom: 6, marginTop: -4 }}>
              DOCX: your exact file is copied and only the skills section is updated. PDF: structure is rebuilt to match.
            </p>
            <input
              type="file"
              accept=".pdf,.docx"
              onChange={e => { setMasterResume(e.target.files[0]); setChangeLog(null); setAppAdded(false); }}
              style={{ padding: '8px 0' }}
            />
            {masterResume && (
              <p style={{ fontSize: '0.85rem', color: '#666', marginTop: 4 }}>{masterResume.name}</p>
            )}
          </div>

          {error && <div className="error-message">{error}</div>}

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button
              className="btn btn-primary"
              onClick={handleGenerate}
              disabled={generating || !masterResume}
              style={{ minWidth: 160 }}
            >
              {generating ? 'Generating...' : 'Generate Resume'}
            </button>
            <button
              className="btn btn-secondary"
              onClick={handleGenerateOutreach}
              disabled={generatingOutreach || generating || !atsContext.jobDescription}
              title={!atsContext.jobDescription ? 'Job description not available from ATS scan' : ''}
            >
              {generatingOutreach ? 'Generating...' : 'Generate Outreach'}
            </button>
          </div>

          {/* Post-generate changelog + Add to Apps */}
          {changeLog && !generating && (
            <div style={{ marginTop: 20, padding: 14, background: '#f0fdf4', borderRadius: 8, border: '1px solid #bbf7d0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <strong style={{ color: '#16a34a', fontSize: '0.9rem' }}>Resume downloaded as .docx</strong>
                {!appAdded ? (
                  <button
                    className="btn btn-primary"
                    style={{ padding: '5px 14px', fontSize: '0.82rem' }}
                    onClick={handleAddToApplications}
                    disabled={addingApp}
                  >
                    {addingApp ? 'Adding...' : '+ Add to Applications'}
                  </button>
                ) : (
                  <span style={{ fontSize: '0.82rem', color: '#16a34a', fontWeight: 500 }}>✓ Added to Applications</span>
                )}
              </div>
              {changeLog.map((entry, i) => (
                <div key={i} style={{ fontSize: '0.82rem', color: '#166534', marginBottom: 2 }}>• {entry}</div>
              ))}
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
