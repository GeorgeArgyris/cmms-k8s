const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'cmmsdb',
    user: process.env.DB_USER || 'cmmsuser',
    password: process.env.DB_PASS || 'cmmspass',
});

module.exports = pool;