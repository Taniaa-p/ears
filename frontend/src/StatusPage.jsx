import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { io } from 'socket.io-client';

const socket = io('http://localhost:5000');

function StatusPage() {
  const { id } = useParams();
  const [incident, setIncident] = useState(null);

  useEffect(() => {
    fetch(`http://localhost:5000/api/incidents/${id}`)
      .then((res) => res.json())
      .then((data) => setIncident(data));

    socket.on('incident_updated', (updated) => {
      if (updated.id === parseInt(id)) {
        setIncident((prev) => ({ ...prev, ...updated }));
      }
    });

    return () => socket.off('incident_updated');
  }, [id]);

  if (!incident) return <p>Loading...</p>;

  const steps = ['pending', 'dispatched', 'resolved'];

  return (
    <div className="confirmation-screen">
      <h2>Incident #{incident.id} Status</h2>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', margin: '20px auto', maxWidth: '400px' }}>
        {Object.entries(incident.responder_statuses || {}).map(([dept, status]) => {
          const currentStep = steps.indexOf(status);
          return (
            <div key={dept} style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '12px', border: '1px solid var(--border)', borderRadius: '6px', textAlign: 'left', background: 'rgba(255, 255, 255, 0.02)' }}>
              <span style={{ fontSize: '15px', fontWeight: 'bold' }}>
                {dept === 'fire' && '🚒 '}
                {dept === 'police' && '🚓 '}
                {dept === 'hospital' && '🚑 '}
                {dept.charAt(0).toUpperCase() + dept.slice(1)} Dispatch Status
              </span>
              <div className="status-tracker" style={{ display: 'flex', gap: '8px', margin: '4px 0', justifyContent: 'flex-start' }}>
                {steps.map((step, i) => (
                  <span key={step} className={`status-step ${i <= currentStep ? 'active' : ''}`}>
                    {step.charAt(0).toUpperCase() + step.slice(1)}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      {incident.nearest_responders && (
        <div style={{ marginTop: '20px', padding: '15px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '8px', textAlign: 'left' }}>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '18px', textAlign: 'center' }}>Nearest Dispatch Info</h3>
          {incident.nearest_responders.nearest_hospital && (
            <p style={{ margin: '6px 0', fontSize: '15px' }}>
              🏥 <strong>{incident.nearest_responders.nearest_hospital.name}</strong> notified ({(incident.nearest_responders.nearest_hospital.distance_meters / 1000).toFixed(2)} km away)
            </p>
          )}
          {incident.nearest_responders.nearest_police && (
            <p style={{ margin: '6px 0', fontSize: '15px' }}>
              🚓 <strong>{incident.nearest_responders.nearest_police.name}</strong> notified ({(incident.nearest_responders.nearest_police.distance_meters / 1000).toFixed(2)} km away)
            </p>
          )}
          {incident.nearest_responders.nearest_fire && (
            <p style={{ margin: '6px 0', fontSize: '15px' }}>
              🚒 <strong>{incident.nearest_responders.nearest_fire.name}</strong> notified ({(incident.nearest_responders.nearest_fire.distance_meters / 1000).toFixed(2)} km away)
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default StatusPage;
