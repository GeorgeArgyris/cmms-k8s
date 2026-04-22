const express = require('express');
const router = express.Router();
const { verifyToken, requireAdmin } = require('../middleware/auth');
const bcrypt = require('bcryptjs');
const pool = require('../db/pool');

router.get('/', verifyToken, requireAdmin, async (req, res) => {
    try {
        const { rows } = await pool.query(
            'SELECT id, name, email, role, is_active, created_at FROM users ORDER BY created_at DESC'
        );
        res.json(rows);
    } catch (_err) {
        console.error(_err);
        res.status(500).json({ error: 'Server error' });
    }
});

router.post('/', verifyToken, requireAdmin, async (req, res) => {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'name, email, password required' });
    try {
        const hash = await bcrypt.hash(password, 10);
        const { rows } = await pool.query(`
      INSERT INTO users (name, email, password_hash, role)
      VALUES ($1,$2,$3,$4) RETURNING id, name, email, role
    `, [name, email, hash, role || 'technician']);
        res.status(201).json(rows[0]);
    } catch (_err) {
        if (_err.code === '23505') return res.status(400).json({ error: 'Email already exists' });
        res.status(500).json({ error: 'Server error' });
    }
});

router.patch('/:id', verifyToken, requireAdmin, async (req, res) => {
    const { name, role, is_active } = req.body;
    try {
        const { rows } = await pool.query(`
      UPDATE users SET name=$1, role=$2, is_active=$3
      WHERE id=$4 RETURNING id, name, email, role, is_active
    `, [name, role, is_active, req.params.id]);
        if (!rows[0]) return res.status(404).json({ error: 'Not found' });
        res.json(rows[0]);
    } catch (_err) {
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;