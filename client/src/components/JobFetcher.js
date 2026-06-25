import React, { useState, useEffect } from 'react';
import api from '../api';

function JobFetcher() {
  const [companies, setCompanies] = useState([]);
  const [fetchedJobs, setFetchedJobs] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ company_name: '', careers_url: '', keywords: '' });
  const [cronStatus, setCronStatus] = useState(null);
  const [fetching, setFetching] = useState(false);
  const [fetchResult, setFetchResult] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [companiesRes, jobsRes, cronRes] = await Promise.all([
        api.get('/cron/companies'),
        api.get('/cron/fetched-jobs'),
        api.get('/cron/cron-status')
      ]);
      setCompanies(companiesRes.data);
      setFetchedJobs(jobsRes.data);
      setCronStatus(cronRes.data);
    } catch (err) {
      console.error('Failed to load data:', err);
    }
  };

  const handleAddCompany = async (e) => {
    e.preventDefault();
    try {
      await api.post('/cron/companies', form);
      setShowModal(false);
      setForm({ company_name: '', careers_url: '', keywords: '' });
      loadData();
    } catch (err) {
      console.error('Failed to add company:', err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this company from tracking?')) return;
    try {
      await api.delete(`/cron/companies/${id}`);
      loadData();
    } catch (err) {
      console.error('Failed to delete:', err);
    }
  };

  const handleToggleActive = async (company) => {
    try {
      await api.put(`/cron/companies/${company.id}`, { active: company.active ? 0 : 1 });
      loadData();
    } catch (err) {
      console.error('Failed to toggle:', err);
    }
  };

  const handleFetchNow = async () => {
    setFetching(true);
    setFetchResult(null);
    try {
      const { data } = await api.post('/cron/fetch-now');
      setFetchResult(data.results);
      loadData();
    } catch (err) {
      console.error('Failed to fetch:', err);
    } finally {
      setFetching(false);
    }
  };

  return (
    <div>
      <h2 style={{ marginBottom: 20 }}>Job Fetcher (Daily Cron)</h2>

      {cronStatus && (
        <div className="cron-status">
          <div className="dot"></div>
          <span>
            <strong>Cron Active:</strong> {cronStatus.description}
          </span>
        </div>
      )}

      <div className="dashboard-header">
        <p style={{ color: '#666' }}>
          Add companies and their careers page URLs. The system will fetch job listings daily at 11:00 AM CST.
        </p>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-success" onClick={handleFetchNow} disabled={fetching || companies.length === 0}>
            {fetching ? 'Fetching...' : 'Fetch Now'}
          </button>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            + Add Company
          </button>
        </div>
      </div>

      {fetchResult && (
        <div style={{ marginTop: 16, padding: 14, background: '#f0fdf4', borderRadius: 8, border: '1px solid #bbf7d0' }}>
          <strong>Fetch Results:</strong>
          <ul style={{ marginTop: 8, paddingLeft: 20, fontSize: '0.9rem' }}>
            {fetchResult.map((r, i) => (
              <li key={i}>
                {r.company}: {r.error ? `Error - ${r.error}` : `${r.jobsFound} jobs found (${r.newJobs} new)`}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="company-list">
        <h3 style={{ marginBottom: 12 }}>Tracked Companies ({companies.length})</h3>
        {companies.length === 0 ? (
          <div className="empty-state">
            <h3>No companies tracked</h3>
            <p>Add a company with its careers page URL to start tracking job postings.</p>
          </div>
        ) : (
          companies.map((company) => (
            <div key={company.id} className="company-item">
              <div className="company-info">
                <h4>
                  {company.company_name}
                  {!company.active && <span style={{ color: '#999', fontSize: '0.8rem', marginLeft: 8 }}>(paused)</span>}
                </h4>
                <a href={company.careers_url} target="_blank" rel="noopener noreferrer">
                  {company.careers_url}
                </a>
                {company.keywords && (
                  <p style={{ fontSize: '0.8rem', color: '#666', marginTop: 4 }}>
                    Keywords: {company.keywords}
                  </p>
                )}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  className="btn btn-secondary"
                  onClick={() => handleToggleActive(company)}
                  style={{ padding: '6px 12px' }}
                >
                  {company.active ? 'Pause' : 'Resume'}
                </button>
                <button
                  className="btn btn-danger"
                  onClick={() => handleDelete(company.id)}
                  style={{ padding: '6px 12px' }}
                >
                  Remove
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="fetched-jobs-list" style={{ marginTop: 30 }}>
        <h3 style={{ marginBottom: 12 }}>Recent Job Listings ({fetchedJobs.length})</h3>
        {fetchedJobs.length === 0 ? (
          <p style={{ color: '#666' }}>No jobs fetched yet. Add companies and click "Fetch Now" or wait for the daily cron.</p>
        ) : (
          fetchedJobs.map((job) => (
            <div key={job.id} className="job-item">
              <a href={job.url} target="_blank" rel="noopener noreferrer">{job.title}</a>
              <div className="job-company">
                {job.company_name} &middot; {new Date(job.fetched_at).toLocaleString()}
              </div>
            </div>
          ))
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Add Company to Track</h3>
            <form onSubmit={handleAddCompany}>
              <div className="form-group">
                <label>Company Name</label>
                <input
                  type="text"
                  value={form.company_name}
                  onChange={(e) => setForm({ ...form, company_name: e.target.value })}
                  placeholder="e.g., Google"
                  required
                />
              </div>
              <div className="form-group">
                <label>Careers Page URL</label>
                <input
                  type="url"
                  value={form.careers_url}
                  onChange={(e) => setForm({ ...form, careers_url: e.target.value })}
                  placeholder="https://careers.google.com/jobs"
                  required
                />
              </div>
              <div className="form-group">
                <label>Keywords (comma-separated, optional)</label>
                <input
                  type="text"
                  value={form.keywords}
                  onChange={(e) => setForm({ ...form, keywords: e.target.value })}
                  placeholder="e.g., engineer, developer, react"
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Add Company</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default JobFetcher;
