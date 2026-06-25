import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import ATSScorer from './components/ATSScorer';
import JobFetcher from './components/JobFetcher';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
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
        <button
          className={`tab ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          Applications
        </button>
        <button
          className={`tab ${activeTab === 'ats' ? 'active' : ''}`}
          onClick={() => setActiveTab('ats')}
        >
          ATS Scanner
        </button>
        <button
          className={`tab ${activeTab === 'jobs' ? 'active' : ''}`}
          onClick={() => setActiveTab('jobs')}
        >
          Job Fetcher
        </button>
      </nav>

      <main className="content">
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'ats' && <ATSScorer />}
        {activeTab === 'jobs' && <JobFetcher />}
      </main>
    </div>
  );
}

export default App;
