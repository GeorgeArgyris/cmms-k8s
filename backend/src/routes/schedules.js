const express = require('express');
const router = express.Router();
const { verifyToken, requireAdmin } = require('../middleware/auth');
const pool = require('../db/pool');

router.get('/', verifyToken, async (req, res) => {
    try {
        const { rows } = await pool.query(`
      SELECT s.*, a.name as asset_name
      FROM maintenance_schedules s
      LEFT JOIN assets a ON s.asset_id = a.id
      WHERE s.is_active = true
      ORDER BY s.next_due ASC
    `);
        res.json(rows);
    } catch (_err) {
        res.status(500).json({ error: 'Server error' });
    }
});

router.post('/', verifyToken, requireAdmin, async (req, res) => {
    const { title, asset_id, frequency, next_due, description } = req.body;
    if (!title || !asset_id || !frequency) return res.status(400).json({ error: 'title, asset_id, frequency required' });
    try {
        const { rows } = await pool.query(`
      INSERT INTO maintenance_schedules (title, asset_id, frequency, next_due, description)
      VALUES ($1,$2,$3,$4,$5) RETURNING *
    `, [title, asset_id, frequency, next_due, description]);
        res.status(201).json(rows[0]);
    } catch (_err) {
        res.status(500).json({ error: 'Server error' });
    }
});

router.patch('/:id', verifyToken, async (req, res) => {
    const { title, frequency, next_due, last_done, description, is_active } = req.body;
    try {
        const { rows } = await pool.query(`
      UPDATE maintenance_schedules SET
        title=$1, frequency=$2, next_due=$3, last_done=$4,
        description=$5, is_active=$6
      WHERE id=$7 RETURNING *
    `, [title, frequency, next_due, last_done, description, is_active, req.params.id]);
        if (!rows[0]) return res.status(404).json({ error: 'Not found' });
        res.json(rows[0]);
    } catch (_err) {
        res.status(500).json({ error: 'Server error' });
    }
});

router.delete('/:id', verifyToken, requireAdmin, async (req, res) => {
    try {
        await pool.query('DELETE FROM maintenance_schedules WHERE id = $1', [req.params.id]);
        res.json({ deleted: true });
    } catch (_err) {
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;