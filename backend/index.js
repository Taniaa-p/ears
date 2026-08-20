const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();
const pool = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' },
});

io.on('connection', (socket) => {
  console.log('A dashboard connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('A dashboard disconnected:', socket.id);
  });
});

app.get('/', (req, res) => {
  res.send('EARS backend is running');
});

app.post('/api/incidents', async (req, res) => {
  try {
    const { responders_needed, description, victim_count, image_url, latitude, longitude, victim_details } = req.body;

    if (!responders_needed || responders_needed.length === 0) {
      return res.status(400).json({ error: 'At least one responder type is required' });
    }
    if (!latitude || !longitude) {
      return res.status(400).json({ error: 'Location is required' });
    }
    if (victim_count !== null && victim_count !== undefined && (isNaN(victim_count) || victim_count < 0)) {
      return res.status(400).json({ error: 'Victim count must be a valid positive number' });
    }

    const initialStatuses = {};
    responders_needed.forEach((r) => { initialStatuses[r] = 'pending'; });

    const result = await pool.query(
      `INSERT INTO incidents (responders_needed, description, victim_count, image_url, victim_details, responder_statuses, location)
       VALUES ($1, $2, $3, $4, $5, $6, ST_SetSRID(ST_MakePoint($7, $8), 4326)::geography)
       RETURNING *, ST_Y(location::geometry) AS latitude, ST_X(location::geometry) AS longitude`,
      [responders_needed, description, victim_count, image_url, victim_details ? JSON.stringify(victim_details) : null, JSON.stringify(initialStatuses), longitude, latitude]
    );

    //$1, $2, $3... — these are parameterized query placeholders. 
    //Never build SQL by directly inserting variables into a string (like "...VALUES ('" + description + "')")
    //that's how SQL injection attacks happen

    io.emit('new_incident', result.rows[0]);

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

app.get('/api/incidents', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, responders_needed, description, victim_count, responder_statuses, image_url, victim_details,
              ST_Y(location::geometry) AS latitude,
              ST_X(location::geometry) AS longitude,
              reported_at, created_at
       FROM incidents
       ORDER BY created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

app.get('/api/incidents/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const incidentResult = await pool.query(
      `SELECT id, responders_needed, description, victim_count, responder_statuses, image_url, victim_details,
              location,
              ST_Y(location::geometry) AS latitude,
              ST_X(location::geometry) AS longitude,
              reported_at, created_at
       FROM incidents
       WHERE id = $1`,
      [id]
    );

    if (incidentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Incident not found' });
    }

    const incident = incidentResult.rows[0];
    const responders = {};

    if (incident.responders_needed.includes('hospital')) {
      const r = await pool.query(
        `SELECT name, ST_Distance(location, $1) AS distance_meters
         FROM hospitals ORDER BY location <-> $1 LIMIT 1`,
        [incident.location]
      );
      responders.nearest_hospital = r.rows[0] || null;
    }

    if (incident.responders_needed.includes('police')) {
      const r = await pool.query(
        `SELECT name, ST_Distance(location, $1) AS distance_meters
         FROM police_stations ORDER BY location <-> $1 LIMIT 1`,
        [incident.location]
      );
      responders.nearest_police = r.rows[0] || null;
    }

    if (incident.responders_needed.includes('fire')) {
      const r = await pool.query(
        `SELECT name, ST_Distance(location, $1) AS distance_meters
         FROM fire_stations ORDER BY location <-> $1 LIMIT 1`,
        [incident.location]
      );
      responders.nearest_fire = r.rows[0] || null;
    }

    delete incident.location;
    res.json({ ...incident, nearest_responders: responders });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

const VALID_TRANSITIONS = {
  pending: ['dispatched'],
  dispatched: ['resolved'],
  resolved: [],
};

app.patch('/api/incidents/:id/status/:department', async (req, res) => {
  try {
    const { id, department } = req.params;
    const { status: newStatus } = req.body;

    if (!['pending', 'dispatched', 'resolved'].includes(newStatus)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const current = await pool.query(`SELECT responder_statuses FROM incidents WHERE id = $1`, [id]);
    if (current.rows.length === 0) return res.status(404).json({ error: 'Incident not found' });

    const statuses = current.rows[0].responder_statuses;
    if (!(department in statuses)) {
      return res.status(400).json({ error: `${department} was not requested for this incident` });
    }

    const currentDeptStatus = statuses[department];
    if (!VALID_TRANSITIONS[currentDeptStatus].includes(newStatus)) {
      return res.status(400).json({ error: `Cannot change ${department} status from '${currentDeptStatus}' to '${newStatus}'` });
    }

    statuses[department] = newStatus;

    const result = await pool.query(
      `UPDATE incidents SET responder_statuses = $1 WHERE id = $2 RETURNING *, ST_Y(location::geometry) AS latitude, ST_X(location::geometry) AS longitude`,
      [JSON.stringify(statuses), id]
    );

    io.emit('incident_updated', result.rows[0]);
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});


const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

//app.use(express.json()) is important — without it, Express won't parse JSON request bodies, 
//and your POST endpoint later won't be able to read the data the frontend sends.

//require('dotenv').config() loads the environment variables from .env into process.env.
// Without it, DATABASE_URL and PORT would be undefined and the app would crash.

//npm start will run this file, Express will boot, and you should see "Server running on port 5000" in your terminal.

//run: node index.js or npm start
