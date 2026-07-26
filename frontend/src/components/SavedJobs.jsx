function SavedJobs({ savedJobs, onUnsave, onTrackFromSaved }) {
  if (savedJobs.length === 0) return null;

  return (
    <div className="saved-jobs-section">
      <h2>Saved for Later ({savedJobs.length})</h2>
      <div className="saved-jobs-row">
        {savedJobs.map((job) => (
          <div key={job._id} className="saved-job-chip">
            <div>
              <strong>{job.position}</strong>
              <p>{job.company}</p>
            </div>
            <div className="saved-job-actions">
              <button className="chip-track" onClick={() => onTrackFromSaved(job)}>Track</button>
              <button className="chip-remove" onClick={() => onUnsave(job._id)}>✕</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default SavedJobs;