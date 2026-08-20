import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api';

const socket = io('http://localhost:5000');

function Dashboard({ department }) {
  const [incidents, setIncidents] = useState([]);
  const [connected, setConnected] = useState(socket.connected);

  const updateStatus = async (id, dept, newStatus) => {
    await fetch(`http://localhost:5000/api/incidents/${id}/status/${dept}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
  };

  const getOverallStatus = (inc) => {
    if (department) {
      return (inc.responder_statuses && inc.responder_statuses[department]) || 'pending';
    }
    const statuses = inc.responder_statuses ? Object.values(inc.responder_statuses) : [];
    if (statuses.length === 0) return 'pending';
    if (statuses.every(s => s === 'resolved')) return 'resolved';
    if (statuses.some(s => s === 'pending')) return 'pending';
    return 'dispatched';
  };

  useEffect(() => {
    fetch('http://localhost:5000/api/incidents')
      .then((res) => res.json())
      .then((data) => setIncidents(data));

    socket.on('connect', () => {
      setConnected(true);
      console.log('Connected to server:', socket.id);
    });

    socket.on('disconnect', () => {
      setConnected(false);
    });

    socket.on('new_incident', (incident) => {
      console.log('New incident received:', incident);
      setIncidents((prev) => [incident, ...prev]);
    });

    socket.on('incident_updated', (updated) => {
      setIncidents((prev) =>
        prev.map((inc) => (inc.id === updated.id ? { ...inc, ...updated } : inc))
      );
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('new_incident');
      socket.off('incident_updated');
    };
  }, []);

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
  });

  const mapCenter = { lat: 13.0827, lng: 80.2707 }; // Chennai center as default

  const filteredIncidents = department
    ? incidents.filter((inc) => inc.responders_needed.includes(department))
    : incidents;

  const getMarkerIcon = (status) => {
    const colors = {
      pending: 'red',
      dispatched: 'yellow',
      resolved: 'green',
    };
    return `http://maps.google.com/mapfiles/ms/icons/${colors[status]}-dot.png`;
  };

  return (
    <div className="dashboard">
      <h2>{department ? `${department.charAt(0).toUpperCase() + department.slice(1)} Dashboard` : 'Responder Dashboard'}</h2>
      <p>Status: {connected ? '🟢 Connected' : '🔴 Disconnected'}</p>

      {isLoaded && (
        <GoogleMap
          mapContainerStyle={{ width: '100%', height: '400px', marginBottom: '20px' }}
          center={mapCenter}
          zoom={11}
        >
          {filteredIncidents.map((inc) => (
            <Marker
              key={inc.id}
              position={{ lat: inc.latitude, lng: inc.longitude }}
              title={`Incident #${inc.id}: ${inc.description || 'No description'}`}
              icon={getMarkerIcon(getOverallStatus(inc))}
            />
          ))}
        </GoogleMap>
      )}

      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Responders</th>
            <th>Description</th>
            <th>Status</th>
            {department === 'hospital' && <th>Medical Info</th>}
            {department && <th>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {filteredIncidents.map((inc) => (
            <tr key={inc.id}>
              <td>{inc.id}</td>
              <td>{inc.responders_needed.join(', ')}</td>
              <td>{inc.description || '—'}</td>
              <td>
                {department
                  ? (inc.responder_statuses && inc.responder_statuses[department])
                  : Object.entries(inc.responder_statuses || {}).map(([dept, stat]) => `${dept}: ${stat}`).join(', ')}
              </td>
              {department === 'hospital' && (
                <td>
                  {inc.victim_details ? (
                    <span>
                      {inc.victim_details.bloodGroup && `Blood: ${inc.victim_details.bloodGroup}`}
                      {inc.victim_details.allergies && ` | Allergies: ${inc.victim_details.allergies}`}
                      {inc.victim_details.conscious === false && ' | Unconscious'}
                    </span>
                  ) : '—'}
                </td>
              )}
              {department && (
                <td>
                  <button
                    onClick={() => updateStatus(inc.id, department, 'dispatched')}
                    disabled={(inc.responder_statuses && inc.responder_statuses[department]) !== 'pending'}
                  >
                    Dispatch
                  </button>
                  <button
                    onClick={() => updateStatus(inc.id, department, 'resolved')}
                    disabled={(inc.responder_statuses && inc.responder_statuses[department]) !== 'dispatched'}
                  >
                    Resolve
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Dashboard;