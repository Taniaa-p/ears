const express = require('express');
require('dotenv').config();

const pool = require('./db');

const app = express();
app.use(express.json());

app.get('/', (req, res) => {
    res.send('EARS backend is running');
});

app.post('/api/incidents', async (req, res) => {
    try {
        const { responders_needed, description, victim_count, image_url, latitude, longitude } = req.body;

        if (!responders_needed || responders_needed.length === 0) {
            return res.status(400).json({ error: 'At least one responder type is required' });
        }
        if (!latitude || !longitude) {
            return res.status(400).json({ error: 'Location is required' });
        }

        const result = await pool.query(
            `INSERT INTO incidents (responders_needed, description, victim_count, image_url, location)
       VALUES ($1, $2, $3, $4, ST_SetSRID(ST_MakePoint($5, $6), 4326)::geography)
       RETURNING *`,
            [responders_needed, description, victim_count, image_url, longitude, latitude]
        );

        //$1, $2, $3... — these are parameterized query placeholders. 
        //Never build SQL by directly inserting variables into a string (like "...VALUES ('" + description + "')")
        //that's how SQL injection attacks happen

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Something went wrong' });
    }
});

app.get('/api/incidents', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, responders_needed, description, victim_count, status, image_url,
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
      `SELECT id, responders_needed, description, victim_count, status, image_url,
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

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

//app.use(express.json()) is important — without it, Express won't parse JSON request bodies, 
//and your POST endpoint later won't be able to read the data the frontend sends.

//require('dotenv').config() loads the environment variables from .env into process.env.
// Without it, DATABASE_URL and PORT would be undefined and the app would crash.

//npm start will run this file, Express will boot, and you should see "Server running on port 5000" in your terminal.

//run: node index.js or npm start
