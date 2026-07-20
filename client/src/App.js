import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import ATSScorer from './components/ATSScorer';
import ResumeReview from './components/ResumeReview';
import JobBoard from './components/JobBoard';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [atsContext, setAtsContext] = useState(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) setUser(JSON.parse(savedUser));
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>Job Application Tracker</h1>
        <div className="header-right">
          <span className="user-name">Hi, {user.name}</span>
          <button onClick={handleLogout} className="btn btn-logout">Logout</button>
        </div>
      </header>

      <nav className="tabs">
        <button className={`tab ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
          Applications
        </button>
        <button className={`tab ${activeTab === 'board' ? 'active' : ''}`} onClick={() => setActiveTab('board')}>
          Job Board
        </button>
        <button className={`tab ${activeTab === 'ats' ? 'active' : ''}`} onClick={() => setActiveTab('ats')}>
          ATS Scanner
        </button>
        <button className={`tab ${activeTab === 'review' ? 'active' : ''}`} onClick={() => setActiveTab('review')}>
          Generate Resume
          {atsContext && <span style={{ marginLeft: 6, fontSize: '0.7rem', background: '#dcfce7', color: '#16a34a', padding: '1px 6px', borderRadius: 8, fontWeight: 600 }}>Ready</span>}
        </button>
      </nav>

      <main className="content">
        <div style={{ display: activeTab === 'dashboard' ? 'block' : 'none' }}>
          <Dashboard />
        </div>
        <div style={{ display: activeTab === 'board' ? 'block' : 'none' }}>
          <JobBoard />
        </div>
        <div style={{ display: activeTab === 'ats' ? 'block' : 'none' }}>
          <ATSScorer onScanComplete={setAtsContext} />
        </div>
        <div style={{ display: activeTab === 'review' ? 'block' : 'none' }}>
          <ResumeReview atsContext={atsContext} onSwitchToATS={() => setActiveTab('ats')} />
        </div>
      </main>
    </div>
  );
}

export default App;
