import { useState } from 'react';
import axios from 'axios';
import ConfirmModal from './ConfirmModal';
import { useToast } from './Toast';

const STATUSES = ['Applied', 'Interview', 'Offer', 'Rejected'];

function daysUntil(dateStr) {
  if (!dateStr) return null;
  const diff = new Date(dateStr) - new Date();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function AIInterviewPrep({ app, token }) {
  const [questions, setQuestions] = useState('');
  const [loading, setLoading] = useState(false);
  const [show, setShow] = useState(false);

  const generateQuestions = async () => {
    setLoading(true);
    setShow(true);
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/ai/interview-prep`,
        { position: app.position, company: app.company },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setQuestions(res.data.questions);
    } catch (err) {
      setQuestions('Could not generate questions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button className="ai-prep-btn" onClick={generateQuestions}>
        ✨ AI Interview Prep
      </button>
      {show && (
        <div className="ai-modal-overlay" onClick={() => setShow(false)}>
          <div className="ai-modal-box ai-modal-purple" onClick={(e) => e.stopPropagation()}>
            <div className="ai-modal-header">
              <span>✨ Interview Prep — {app.position}</span>
              <button className="ai-modal-close" onClick={() => setShow(false)}>✕</button>
            </div>
            {loading ? (
              <p className="ai-prep-loading">Generating questions...</p>
            ) : (
              <pre className="ai-prep-questions">{questions}</pre>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function AICoverLetter({ app, token }) {
  const [letter, setLetter] = useState('');
  const [loading, setLoading] = useState(false);
  const [show, setShow] = useState(false);
  const [copied, setCopied] = useState(false);

  const generateLetter = async () => {
    setLoading(true);
    setShow(true);
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/ai/cover-letter`,
        { position: app.position, company: app.company },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setLetter(res.data.coverLetter);
    } catch (err) {
      setLetter('Could not generate cover letter. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(letter);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <button className="ai-cover-btn" onClick={generateLetter}>
        ✉️ AI Cover Letter
      </button>
      {show && (
        <div className="ai-modal-overlay" onClick={() => setShow(false)}>
          <div className="ai-modal-box ai-modal-green" onClick={(e) => e.stopPropagation()}>
            <div className="ai-modal-header">
              <span>✉️ Cover Letter — {app.position}</span>
              <button className="ai-modal-close" onClick={() => setShow(false)}>✕</button>
            </div>
            {loading ? (
              <p className="ai-prep-loading">Writing your opener...</p>
            ) : (
              <>
                <p className="ai-cover-text">{letter}</p>
                <button className="ai-copy-btn" onClick={copyToClipboard}>
                  {copied ? '✓ Copied!' : '📋 Copy'}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function ApplicationCard({ app, token, refresh, onDragStart, onRequestDelete }) {
  const [showNotes, setShowNotes] = useState(false);
  const [notes, setNotes] = useState(app.notes || '');
  const [interviewDate, setInterviewDate] = useState(
    app.interviewDate ? app.interviewDate.slice(0, 10) : ''
  );
  const authHeader = { headers: { Authorization: `Bearer ${token}` } };
  const showToast = useToast();

  const saveDetails = async () => {
    await axios.put(
  `${import.meta.env.VITE_API_URL}/api/applications/${app._id}`,
  { notes, interviewDate: interviewDate || null },
  authHeader
);
    refresh();
    setShowNotes(false);
    showToast('Details saved', 'success');
  };

  const daysLeft = daysUntil(app.interviewDate);

  return (
    <div className="kanban-card" draggable onDragStart={(e) => onDragStart(e, app._id)}>
      <div className="kanban-card-top">
        <strong>{app.position}</strong>
        <button className="kanban-delete" onClick={() => onRequestDelete(app)}>✕</button>
      </div>
      <p className="kanban-company">{app.company}</p>

      {daysLeft !== null && (
        <span className={`interview-badge ${daysLeft < 0 ? 'past' : daysLeft <= 3 ? 'soon' : ''}`}>
          {daysLeft < 0 ? 'Interview passed' : daysLeft === 0 ? 'Interview today!' : `Interview in ${daysLeft}d`}
        </span>
      )}

            <AIInterviewPrep app={app} token={token} />
            <AICoverLetter app={app} token={token} />
      

      {app.notes && !showNotes && (
        <p className="kanban-notes-preview" onClick={() => setShowNotes(true)}>
          📝 {app.notes.slice(0, 40)}{app.notes.length > 40 ? '...' : ''}
        </p>
      )}

      {!showNotes ? (
        <button className="kanban-edit-btn" onClick={() => setShowNotes(true)}>
          + Notes / Interview date
        </button>
      ) : (
        <div className="kanban-edit-box">
          <textarea
            placeholder="Add a note..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
          />
          <label className="kanban-date-label">
            Interview date:
            <input type="date" value={interviewDate} onChange={(e) => setInterviewDate(e.target.value)} />
          </label>
          <div className="kanban-edit-actions">
            <button onClick={saveDetails}>Save</button>
            <button className="cancel" onClick={() => setShowNotes(false)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

function ApplicationTracker({ applications, refresh, token }) {
  const authHeader = { headers: { Authorization: `Bearer ${token}` } };
  const [pendingDelete, setPendingDelete] = useState(null);
  const showToast = useToast();

  const handleDragStart = (e, id) => e.dataTransfer.setData('appId', id);

  const handleDrop = async (e, newStatus) => {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');
    const id = e.dataTransfer.getData('appId');
await axios.put(`${import.meta.env.VITE_API_URL}/api/applications/${id}`, { status: newStatus }, authHeader);
    refresh();
    showToast(`Moved to ${newStatus}`, 'success');
  };

  const allowDrop = (e) => {
    e.preventDefault();
    e.currentTarget.classList.add('drag-over');
  };

  const handleDragLeave = (e) => e.currentTarget.classList.remove('drag-over');

  const confirmDelete = async () => {
await axios.delete(`${import.meta.env.VITE_API_URL}/api/applications/${pendingDelete._id}`, authHeader);
    refresh();
    showToast(`Removed "${pendingDelete.position}"`, 'success');
    setPendingDelete(null);
  };

  return (
    <div className="tracker">
      <h2>My Applications ({applications.length})</h2>

      {applications.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📋</div>
          <p>No applications tracked yet.</p>
          <span>Click "+ Track" on a job to start building your board.</span>
        </div>
      ) : (
        <div className="kanban-board">
          {STATUSES.map((status) => (
            <div
              key={status}
              className={`kanban-column status-${status.toLowerCase()}`}
              onDragOver={allowDrop}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, status)}
            >
              <div className="kanban-column-header">
                {status} <span>{applications.filter((a) => a.status === status).length}</span>
              </div>
              {applications
                .filter((a) => a.status === status)
                .map((app) => (
                  <ApplicationCard
                    key={app._id}
                    app={app}
                    token={token}
                    refresh={refresh}
                    onDragStart={handleDragStart}
                    onRequestDelete={setPendingDelete}
                  />
                ))}
            </div>
          ))}
        </div>
      )}

      <ConfirmModal
        open={!!pendingDelete}
        title="Remove application?"
        message={pendingDelete ? `Remove "${pendingDelete.position}" at ${pendingDelete.company} from your tracker?` : ''}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}

export default ApplicationTracker;