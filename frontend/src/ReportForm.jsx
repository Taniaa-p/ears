import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function ReportForm({ onBack }) {
  const navigate = useNavigate();
  const [location, setLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [responders, setResponders] = useState([]);
  const [description, setDescription] = useState('');
  const [victimCount, setVictimCount] = useState('');
  const [image, setImage] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submittedIncident, setSubmittedIncident] = useState(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        setLocationError('Could not get your location: ' + error.message);
      }
    );
  }, []);

  const toggleResponder = (type) => {
    setResponders((prev) =>
      prev.includes(type) ? prev.filter((r) => r !== type) : [...prev, type]
    );
  };

  const handleSubmit = async () => {
  if (responders.length === 0) {
    setSubmitError('Please select at least one responder type');
    return;
  }
  if (!location) {
    setSubmitError('Waiting for location — please allow location access');
    return;
  }

  setSubmitting(true);
  setSubmitError(null);

  try {
    const response = await fetch('http://localhost:5000/api/incidents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        responders_needed: responders,
        description,
        victim_count: victimCount ? parseInt(victimCount) : null,
        latitude: location.latitude,
        longitude: location.longitude,
      }),
    });

    if (!response.ok) throw new Error('Failed to submit report');

    const data = await response.json();
    setSubmittedIncident(data);
  } catch (err) {
    setSubmitError(err.message);
  } finally {
    setSubmitting(false);
  }
};


   if (submittedIncident) {
    return (
      <div className="confirmation-screen">
        <div className="confirmation-icon">✅</div>
        <h2>Help is on the way</h2>
        <p>Incident #{submittedIncident.id} reported successfully.</p>
        <div className="status-tracker">
          <span className="status-step active">Reported</span>
          <span className="status-step">Notified</span>
          <span className="status-step">Dispatched</span>
        </div>
        <button onClick={() => navigate('/')}>Report Another Emergency</button>
      </div>
    );
  }
  return (
    <div className="report-form">
      <button onClick={() => navigate('/')}>← Back</button>
      <h2>Report Emergency</h2>

      <div className="location-status">
        {location && <p>📍 Location captured: {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}</p>}
        {locationError && <p className="error">{locationError}</p>}
        {!location && !locationError && <p>Getting your location...</p>}
      </div>

      <div className="responder-checkboxes">
        <label>
          <input type="checkbox" checked={responders.includes('fire')} onChange={() => toggleResponder('fire')} />
          🚒 Fire
        </label>
        <label>
          <input type="checkbox" checked={responders.includes('police')} onChange={() => toggleResponder('police')} />
          🚓 Police
        </label>
        <label>
          <input type="checkbox" checked={responders.includes('hospital')} onChange={() => toggleResponder('hospital')} />
          🚑 Hospital
        </label>
      </div>

      <textarea
        placeholder="Describe the incident (optional)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />

      <input
        type="number"
        placeholder="Number of victims (optional)"
        value={victimCount}
        onChange={(e) => setVictimCount(e.target.value)}
      />

      <input
        type="file"
        accept="image/*"
        capture="environment"
        onChange={(e) => setImage(e.target.files[0])}
      />

      {submitError && <p className="error">{submitError}</p>}

      <button onClick={handleSubmit} disabled={submitting}>
        {submitting ? 'Submitting...' : 'Submit Report'}
      </button>
    </div>
  );
}

export default ReportForm;