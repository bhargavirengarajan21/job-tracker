import React, { useState, useEffect } from 'react';
import api from '../api';

const EMPTY_FORM = {
  company: '', position: '', status: 'applied', notes: '', job_url: '', ats_score: ''
};

function Dashboard() {
  const [applications, setApplications] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingApp, setEditingApp] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const { data } = await api.get('/applications');
      setApplications(data);
    } catch (err) {
      console.error('Failed to fetch applications:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingApp) {
        await api.put(`/applications/${editingApp.id}`, form);
      } else {
        await api.post('/applications', form);
      }
      setShowModal(false);
      setEditingApp(null);
      setForm(EMPTY_FORM);
      fetchApplications();
    } catch (err) {
      console.error('Failed to save application:', err);
    }
  };

  const handleEdit = (app) => {
    setEditingApp(app);
    setForm({
      company: app.company,
      position: app.position,
      status: app.status,
      notes: app.notes || '',
      job_url: app.job_url || '',
      ats_score: app.ats_score || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this application?')) return;
    try {
      await api.delete(`/applications/${id}`);
      fetchApplications();
    } catch (err) {
      console.error('Failed to delete:', err);
    }
  };

  const stats = {
    total: applications.length,
    applied: applications.filter(a => a.status === 'applied').length,
    interview: applications.filter(a => a.status === 'interview').length,
    offer: applications.filter(a => a.status === 'offer').length,
    rejected: applications.filter(a => a.status === 'rejected').length,
  };

  return (
    <div>
      <div className="dashboard-header">
        <h2>Application History</h2>
        <button className="btn btn-primary" onClick={() => { setEditingApp(null); setForm(EMPTY_FORM); setShowModal(true); }}>
          + Add Application
        </button>
      </div>

      <div className="stats">
        <div className="stat-card"><div className="number">{stats.total}</div><div className="label">Total</div></div>
        <div className="stat-card"><div className="number">{stats.applied}</div><div className="label">Applied</div></div>
        <div className="stat-card"><div className="number">{stats.interview}</div><div className="label">Interview</div></div>
        <div className="stat-card"><div className="number">{stats.offer}</div><div className="label">Offers</div></div>
        <div className="stat-card"><div className="number">{stats.rejected}</div><div className="label">Rejected</div></div>
      </div>

      {applications.length === 0 ? (
        <div className="empty-state">
          <h3>No applications yet</h3>
          <p>Click "Add Application" to start tracking your job search.</p>
        </div>
      ) : (
        <table className="applications-table">
          <thead>
            <tr>
              <th>Company</th>
              <th>Position</th>
              <th>Status</th>
              <th>ATS Score</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {applications.map((app) => (
              <tr key={app.id}>
                <td><strong>{app.company}</strong></td>
                <td>{app.position}</td>
                <td>
                  <span className={`status-badge status-${app.status}`}>{app.status}</span>
                </td>
                <td>{app.ats_score ? `${app.ats_score}%` : '-'}</td>
                <td>{new Date(app.applied_date).toLocaleDateString()}</td>
                <td>
                  <button className="btn btn-secondary" onClick={() => handleEdit(app)} style={{ marginRight: 8, padding: '6px 12px' }}>Edit</button>
                  <button className="btn btn-danger" onClick={() => handleDelete(app.id)} style={{ padding: '6px 12px' }}>Del</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 560 }}>
            <h3>{editingApp ? 'Edit Application' : 'Add Application'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Company</label>
                <input type="text" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Position</label>
                <input type="text" value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Status</label>
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                  <option value="applied">Applied</option>
                  <option value="interview">Interview</option>
                  <option value="offer">Offer</option>
                  <option value="rejected">Rejected</option>
                  <option value="accepted">Accepted</option>
                </select>
              </div>
              <div className="form-group">
                <label>Job URL</label>
                <input type="url" value={form.job_url} onChange={(e) => setForm({ ...form, job_url: e.target.value })} placeholder="https://..." />
              </div>
              <div className="form-group">
                <label>Notes</label>
                <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Any notes about this application..." />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editingApp ? 'Update' : 'Add'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

export default Dashboard;
