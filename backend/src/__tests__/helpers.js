/**
 * helpers.js — shared test utilities
 *
 * Every test file imports from here instead of duplicating setup logic.
 * This keeps tests short and focused on what they're actually testing.
 */

const pool = require('../db/pool');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

// ─────────────────────────────────────────────────────────────
// DB — schema creation (run once before the whole test suite)
// ─────────────────────────────────────────────────────────────
async function createSchema() {
    await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id            SERIAL PRIMARY KEY,
      name          VARCHAR(100) NOT NULL,
      email         VARCHAR(255) UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role          VARCHAR(20) NOT NULL DEFAULT 'technician',
      is_active     BOOLEAN NOT NULL DEFAULT true,
      created_at    TIMESTAMPTZ DEFAULT NOW()
    )
  `);

    await pool.query(`
    CREATE TABLE IF NOT EXISTS locations (
      id         SERIAL PRIMARY KEY,
      name       VARCHAR(100) NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

    await pool.query(`
    CREATE TABLE IF NOT EXISTS asset_categories (
      id         SERIAL PRIMARY KEY,
      name       VARCHAR(100) NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

    await pool.query(`
    CREATE TABLE IF NOT EXISTS assets (
      id            SERIAL PRIMARY KEY,
      name          VARCHAR(200) NOT NULL,
      serial_number VARCHAR(100),
      model         VARCHAR(100),
      category_id   INTEGER REFERENCES asset_categories(id),
      location_id   INTEGER REFERENCES locations(id),
      status        VARCHAR(30) NOT NULL DEFAULT 'active',
      purchase_date DATE,
      notes         TEXT,
      created_at    TIMESTAMPTZ DEFAULT NOW(),
      updated_at    TIMESTAMPTZ DEFAULT NOW()
    )
  `);

    await pool.query(`
    CREATE TABLE IF NOT EXISTS work_orders (
      id           SERIAL PRIMARY KEY,
      title        VARCHAR(200) NOT NULL,
      description  TEXT,
      asset_id     INTEGER REFERENCES assets(id),
      assigned_to  INTEGER REFERENCES users(id),
      created_by   INTEGER REFERENCES users(id),
      status       VARCHAR(30) NOT NULL DEFAULT 'open',
      priority     VARCHAR(20) NOT NULL DEFAULT 'medium',
      due_date     DATE,
      completed_at TIMESTAMPTZ,
      created_at   TIMESTAMPTZ DEFAULT NOW(),
      updated_at   TIMESTAMPTZ DEFAULT NOW()
    )
  `);

    await pool.query(`
    CREATE TABLE IF NOT EXISTS maintenance_schedules (
      id          SERIAL PRIMARY KEY,
      title       VARCHAR(200) NOT NULL,
      asset_id    INTEGER REFERENCES assets(id),
      frequency   VARCHAR(30) NOT NULL,
      next_due    DATE,
      last_done   DATE,
      description TEXT,
      is_active   BOOLEAN DEFAULT true,
      created_at  TIMESTAMPTZ DEFAULT NOW()
    )
  `);

    await pool.query(`
    CREATE TABLE IF NOT EXISTS work_order_comments (
      id            SERIAL PRIMARY KEY,
      work_order_id INTEGER REFERENCES work_orders(id) ON DELETE CASCADE,
      user_id       INTEGER REFERENCES users(id),
      body          TEXT NOT NULL,
      created_at    TIMESTAMPTZ DEFAULT NOW()
    )
  `);
}

// ─────────────────────────────────────────────────────────────
// Seed — insert test users and return their IDs + tokens
// ─────────────────────────────────────────────────────────────
async function seedUsers() {
    const hash = await bcrypt.hash('Password123!', 10);

    const { rows: [admin] } = await pool.query(
        `INSERT INTO users (name, email, password_hash, role)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
     RETURNING *`,
        ['Admin User', 'admin@test.local', hash, 'admin']
    );

    const { rows: [tech] } = await pool.query(
        `INSERT INTO users (name, email, password_hash, role)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
     RETURNING *`,
        ['Tech User', 'tech@test.local', hash, 'technician']
    );

    return { admin, tech };
}

// ─────────────────────────────────────────────────────────────
// Token helpers — generate valid JWTs without hitting /login
// ─────────────────────────────────────────────────────────────
function makeToken(user) {
    return jwt.sign(
        { id: user.id, name: user.name, role: user.role },
        JWT_SECRET,
        { expiresIn: '1h' }
    );
}

function authHeader(user) {
    return { Authorization: `Bearer ${makeToken(user)}` };
}

// ─────────────────────────────────────────────────────────────
// Seed — insert a minimal asset for FK references
// ─────────────────────────────────────────────────────────────
async function seedAsset(name = 'Test Asset') {
    const { rows: [asset] } = await pool.query(
        `INSERT INTO assets (name, status) VALUES ($1, 'active') RETURNING *`,
        [name]
    );
    return asset;
}

// ─────────────────────────────────────────────────────────────
// Cleanup — wipe test data in FK-safe order
// ─────────────────────────────────────────────────────────────
async function cleanDb() {
    await pool.query('DELETE FROM work_order_comments');
    await pool.query('DELETE FROM work_orders');
    await pool.query('DELETE FROM maintenance_schedules');
    await pool.query('DELETE FROM assets');
    await pool.query('DELETE FROM asset_categories');
    await pool.query('DELETE FROM locations');
    await pool.query("DELETE FROM users WHERE email LIKE '%@test.local'");
}

module.exports = {
    pool,
    createSchema,
    seedUsers,
    seedAsset,
    cleanDb,
    makeToken,
    authHeader,
};