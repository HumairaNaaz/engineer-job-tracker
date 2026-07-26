import { useEffect, useState } from 'react';
import axios from 'axios';
import { useToast } from './Toast';

const CATEGORIES = ['All', 'Software', 'DevOps', 'Data', 'Mechanical', 'Electrical', 'Civil', 'Other'];

function SkeletonCard() {
  return (
    <div className="job-card skeleton-card">
      <div>
        <div className="skeleton-line skeleton-title"></div>
        <div className="skeleton-line skeleton-sub"></div>
      </div>
      <div className="skeleton-btn"></div>
    </div>
  );
}

function JobFitScore({ job, token }) {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const showToast = useToast();

  const checkFit = async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/ai/job-fit`,
        { position: job.position, company: job.company, tags: job.tags },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setResult(res.data);
    } catch (err) {
      if (err.response?.status === 400) {
        showToast('Add your skills first (My Skills button)', 'error');
      } else {
        showToast('Could not calculate fit', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <span className="fit-badge fit-loading">Checking...</span>;

  if (result?.score !== null && result?.score !== undefined) {
    const level = result.score >= 75 ? 'high' : result.score >= 50 ? 'mid' : 'low';
    return (
      <span className={`fit-badge fit-${level}`} title={result.reason}>
        {result.score}% match
      </span>
    );
  }

  return (
    <button className="fit-check-btn" onClick={checkFit}>
      🎯 Check Fit
    </button>
  );
}

function JobsList({ onTrack, savedIds, onSave, onUnsave, token}) {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const showToast = useToast();

  useEffect(() => {
    axios.get(`${import.meta.env.VITE_API_URL}/api/jobs`)
      .then((res) => setJobs(res.data))
      .catch(() => showToast('Could not load jobs. Try again shortly.', 'error'))
      .finally(() => setLoading(false));
  }, []);

  const handleTrack = async (job) => {
    try {
      await onTrack(job);
      showToast(`Tracking "${job.position}"`, 'success');
    } catch (err) {
      if (err.response?.status === 409) {
        showToast('Already tracking this job', 'error');
      } else {
        showToast('Could not track this job', 'error');
      }
    }
  };

  const handleSaveToggle = async (job) => {
    const isSaved = savedIds.includes(job.id);
    try {
      if (isSaved) {
        await onUnsave(job.id);
        showToast('Removed from saved', 'success');
      } else {
        await onSave(job);
        showToast('Job saved for later', 'success');
      }
    } catch (err) {
      showToast('Something went wrong', 'error');
    }
  };

  const filteredJobs = jobs.filter((job) => {
    const matchesSearch =
      job.position.toLowerCase().includes(search.toLowerCase()) ||
      job.company.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = category === 'All' || job.category === category;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="jobs-list">
      <h2>Live Openings</h2>

      <div className="filters">
        <input
          type="text"
          placeholder="Search by title or company..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="search-input"
        />
        <select value={category} onChange={(e) => setCategory(e.target.value)} className="category-select">
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {loading && (
        <>
          <SkeletonCard /><SkeletonCard /><SkeletonCard />
        </>
      )}

      {!loading && filteredJobs.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">🔍</div>
          <p>No matching jobs found.</p>
          <span>Try a different search term or category.</span>
        </div>
      )}

      {!loading && filteredJobs.map((job, i) => (
        <div key={job.id} className="job-card fade-in" style={{ animationDelay: `${i * 0.03}s` }}>
          <div>
            <strong>{job.position}</strong>
            <p>{job.company}</p>
            {job.tags?.length > 0 && (
              <p className="tags">{job.tags.slice(0, 4).join(' · ')}</p>
            )}
          </div>
          <div className="job-card-actions">
            <JobFitScore job={job} token={token} />
            <button
              className={`save-btn ${savedIds.includes(job.id) ? 'saved' : ''}`}
              onClick={() => handleSaveToggle(job)}
              title={savedIds.includes(job.id) ? 'Remove from saved' : 'Save for later'}
            >
              {savedIds.includes(job.id) ? '★' : '☆'}
            </button>
            <button onClick={() => handleTrack(job)}>+ Track</button>
          </div>
        </div>
      ))}
    </div>
  );
}

export default JobsList;