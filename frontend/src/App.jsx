import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import JobsList from './components/JobsList';
import ApplicationTracker from './components/ApplicationTracker';
import SavedJobs from './components/SavedJobs';
import SkillsModal from './components/SkillsModal';
import Login from './pages/Login';
import Signup from './pages/Signup';
import NotFound from './pages/NotFound';
import { useToast } from './components/Toast';
import './App.css';

function Dashboard({ token, userName, logout }) {
  const [applications, setApplications] = useState([]);
  const [savedJobs, setSavedJobs] = useState([]);
  const [skillsOpen, setSkillsOpen] = useState(false);
  const authHeader = { headers: { Authorization: `Bearer ${token}` } };
  const showToast = useToast();

  const fetchApplications = () => {
    axios.get(`${import.meta.env.VITE_API_URL}/api/applications`, authHeader)
      .then((res) => setApplications(res.data));
  };

  const fetchSaved = () => {
    axios.get(`${import.meta.env.VITE_API_URL}/api/saved`, authHeader)
      .then((res) => setSavedJobs(res.data));
  };

  useEffect(() => {
    fetchApplications();
    fetchSaved();
  }, []);

  const trackJob = async (job) => {
    await axios.post(`${import.meta.env.VITE_API_URL}/api/applications`, {
      company: job.company,
      position: job.position,
      url: job.url,
    }, authHeader);
    fetchApplications();
  };

  const saveJob = async (job) => {
    await axios.post(`${import.meta.env.VITE_API_URL}/api/saved`, {
      jobId: job.id,
      company: job.company,
      position: job.position,
      url: job.url,
    }, authHeader);
    fetchSaved();
  };

  const unsaveJob = async (savedId) => {
    await axios.delete(`${import.meta.env.VITE_API_URL}/api/saved/${savedId}`, authHeader);
    fetchSaved();
  };

  const trackFromSaved = async (job) => {
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/applications`, {
        company: job.company,
        position: job.position,
        url: job.url,
      }, authHeader);
      await axios.delete(`${import.meta.env.VITE_API_URL}/api/saved/${job._id}`, authHeader);
      fetchApplications();
      fetchSaved();
      showToast(`Now tracking "${job.position}"`, 'success');
    } catch (err) {
      if (err.response?.status === 409) {
        showToast('Already tracking this job', 'error');
      }
    }
  };

  const savedIds = savedJobs.map((s) => s.jobId);

  const counts = {
    Applied: applications.filter((a) => a.status === 'Applied').length,
    Interview: applications.filter((a) => a.status === 'Interview').length,
    Offer: applications.filter((a) => a.status === 'Offer').length,
    Rejected: applications.filter((a) => a.status === 'Rejected').length,
  };

  return (
    <div className="app">
      <div className="topbar">
        <h1>Engineer Job Tracker</h1>
        <div className="user-info">
        <div className="user-avatar">{userName ? userName.charAt(0).toUpperCase() : '?'}</div>
          <span>Hi, {userName}</span>
          <button className="logout-btn" onClick={logout}>Log Out</button>
        </div>
      </div>

      <div className="stats">
        <div className="stat-card applied">Applied<span>{counts.Applied}</span></div>
        <div className="stat-card interview">Interview<span>{counts.Interview}</span></div>
        <div className="stat-card offer">Offer<span>{counts.Offer}</span></div>
        <div className="stat-card rejected">Rejected<span>{counts.Rejected}</span></div>
      </div>

      <SavedJobs savedJobs={savedJobs} onUnsave={unsaveJob} onTrackFromSaved={trackFromSaved} />

      <div className="skills-banner">
        <div>
          <strong>🎯 Get AI-powered job match scores</strong>
          <p>Add your skills once, then check how well any job fits you.</p>
        </div>
        <button className="skills-btn" onClick={() => setSkillsOpen(true)}>My Skills</button>
      </div>

      <div className="jobs-section">
        <JobsList onTrack={trackJob} savedIds={savedIds} onSave={saveJob} token={token} onUnsave={async (jobId) => {
          const match = savedJobs.find((s) => s.jobId === jobId);
          if (match) await unsaveJob(match._id);
        }} />
      </div>
      <div className="tracker-section">
        <ApplicationTracker applications={applications} refresh={fetchApplications} token={token} />
      </div>

      <div className="promo-banners">
        <div className="promo-banner tip-banner">
          <span className="promo-icon">💡</span>
          <div>
            <strong>Tip: Follow up after 5-7 days</strong>
            <p>If you haven't heard back, a polite follow-up email can boost your response rate.</p>
          </div>
        </div>

        <div className="promo-banner feature-banner">
          <span className="promo-icon">✨</span>
          <div>
            <strong>New: AI Interview Prep & Cover Letters</strong>
            <p>Click the AI buttons on any tracked job to get instant, tailored prep material.</p>
          </div>
        </div>
      </div>

      <SkillsModal open={skillsOpen} onClose={() => setSkillsOpen(false)} token={token} />
        <footer className="app-footer">
        Built with ❤️ by <strong>Humaira Naaz</strong> · Engineer Job Tracker © {new Date().getFullYear()}
      </footer>
    </div>
  );
}

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const userName = localStorage.getItem('userName');

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userName');
    setToken(null);
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={token ? <Navigate to="/" /> : <Login setToken={setToken} />} />
        <Route path="/signup" element={token ? <Navigate to="/" /> : <Signup setToken={setToken} />} />
        <Route
          path="/"
          element={token ? <Dashboard token={token} userName={userName} logout={logout} /> : <Navigate to="/login" />}
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;