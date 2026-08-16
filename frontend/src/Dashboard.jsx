import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const socket = io('http://localhost:5000');

function Dashboard() {
  const [incidents, setIncidents] = useState([]);
  const [connected, setConnected] = useState(socket.connected);

  const updateStatus = async (id, newStatus) => {
    await fetch(`http://localhost:5000/api/incidents/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
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
        prev.map((inc) => (inc.id === updated.id ? updated : inc))
      );
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('new_incident');
      socket.off('incident_updated');
    };
  }, []);

  return (
    <div className="dashboard">
      <h2>Responder Dashboard</h2>
      <p>Status: {connected ? '🟢 Connected' : '🔴 Disconnected'}</p>

      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Responders</th>
            <th>Description</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {incidents.map((inc) => (
            <tr key={inc.id}>
              <td>{inc.id}</td>
              <td>{inc.responders_needed.join(', ')}</td>
              <td>{inc.description || '—'}</td>
              <td>{inc.status}</td>
              <td>
                <button onClick={() => updateStatus(inc.id, 'dispatched')}>Dispatch</button>
                <button onClick={() => updateStatus(inc.id, 'resolved')}>Resolve</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Dashboard;