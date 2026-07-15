const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

module.exports = pool;

//Pool (from pg) manages a set of reusable database connections instead of opening a new one for every query — much more efficient than connecting fresh each time.
//require('dotenv').config() reads your .env file and makes process.env.DATABASE_URL available.
//We export pool so any other file (like our routes) can require('./db') and run queries against it.