import { useState, useEffect } from 'react';
import axios from 'axios';
import { useToast } from './Toast';

function SkillsModal({ open, onClose, token }) {
  const [skills, setSkills] = useState('');
  const [loading, setLoading] = useState(false);
  const showToast = useToast();

  useEffect(() => {
    if (open) {
      axios.get(`${import.meta.env.VITE_API_URL}/api/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then((res) => setSkills(res.data.skills || ''));
    }
  }, [open]);

  const save = async () => {
    setLoading(true);
    try {
      await axios.put(
        `${import.meta.env.VITE_API_URL}/api/profile/skills`,
        { skills },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      showToast('Skills updated', 'success');
      onClose();
    } catch (err) {
      showToast('Could not save skills', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box skills-modal" onClick={(e) => e.stopPropagation()}>
        <h3>Your Skills</h3>
        <p>List your skills, separated by commas. Used to calculate AI job fit scores.</p>
        <textarea
          className="skills-textarea"
          rows={4}
          placeholder="e.g. React, Node.js, Python, AWS, SQL, Docker"
          value={skills}
          onChange={(e) => setSkills(e.target.value)}
        />
        <div className="modal-actions">
          <button className="modal-cancel" onClick={onClose}>Cancel</button>
          <button className="modal-confirm skills-save" onClick={save} disabled={loading}>
            {loading ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default SkillsModal;