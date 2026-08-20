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
  const [victimDetails, setVictimDetails] = useState({ bloodGroup: '', allergies: '', conditions: '', conscious: true });

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
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  }, []);

  const toggleResponder = (type) => {
    setResponders((prev) =>
      prev.includes(type) ? prev.filter((r) => r !== type) : [...prev, type]
    );
  };

  const uploadImage = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'ears_incidents');

    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'ngdldi6d';
    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();
    return data.secure_url;
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

    if (victimCount && (isNaN(victimCount) || parseInt(victimCount) < 0)) {
      setSubmitError('Victim count must be a valid positive number');
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      let imageUrl = null;
      if (image) {
        imageUrl = await uploadImage(image);
      }

      const response = await fetch('http://localhost:5000/api/incidents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          responders_needed: responders,
          description,
          victim_count: victimCount ? parseInt(victimCount) : null,
          latitude: location.latitude,
          longitude: location.longitude,
          victim_details: responders.includes('hospital') ? victimDetails : null,
          image_url: imageUrl,
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
        <div style={{ margin: '24px 0' }}>
          <a href={`/status/${submittedIncident.id}`} style={{ fontWeight: '600', color: '#16a34a', textDecoration: 'none' }}>
            Track your report status →
          </a>
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
        min="0"
        step="1"
        placeholder="Number of victims (optional)"
        value={victimCount}
        onChange={(e) => {
          const val = e.target.value;
          if (val === '' || (Number(val) >= 0 && Number.isInteger(Number(val)))) {
            setVictimCount(val);
          }
        }}
      />

      {responders.includes('hospital') && (
        <div className="victim-details" style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '12px', border: '1px solid #ccc', borderRadius: '6px', textAlign: 'left', background: 'rgba(255, 255, 255, 0.05)' }}>
          <h3 style={{ margin: '0 0 5px 0', fontSize: '16px' }}>Victim Medical Details (optional)</h3>
          <input
            placeholder="Blood group (e.g. O+, A-)"
            value={victimDetails.bloodGroup}
            onChange={(e) => setVictimDetails({ ...victimDetails, bloodGroup: e.target.value })}
          />
          <input
            placeholder="Known allergies"
            value={victimDetails.allergies}
            onChange={(e) => setVictimDetails({ ...victimDetails, allergies: e.target.value })}
          />
          <input
            placeholder="Existing conditions"
            value={victimDetails.conditions}
            onChange={(e) => setVictimDetails({ ...victimDetails, conditions: e.target.value })}
          />
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '14px' }}>
            <input
              type="checkbox"
              checked={victimDetails.conscious}
              onChange={(e) => setVictimDetails({ ...victimDetails, conscious: e.target.checked })}
            />
            Victim is conscious
          </label>
        </div>
      )}

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
      {locationError && (
        <button onClick={() => window.location.reload()}>Retry</button>
      )}
    </div>
  );
}

export default ReportForm;