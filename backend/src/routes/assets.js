const express = require('express');
const router = express.Router();
const { verifyToken, requireAdmin } = require('../middleware/auth');

const pool = require('../db/pool');

// GET all assets
router.get('/', verifyToken, async (req, res) => {
    try {
        const { rows } = await pool.query(`
      SELECT a.*, c.name as category, l.name as location
      FROM assets a
      LEFT JOIN asset_categories c ON a.category_id = c.id
      LEFT JOIN locations l ON a.location_id = l.id
      ORDER BY a.created_at DESC
    `);
        res.json(rows);
    } catch (_err) {
        console.error(_err);
        res.status(500).json({ error: 'Server error' });
    }
});

// GET single asset
router.get('/:id', verifyToken, async (req, res) => {
    try {
        const { rows } = await pool.query(`
      SELECT a.*, c.name as category, l.name as location
      FROM assets a
      LEFT JOIN asset_categories c ON a.category_id = c.id
      LEFT JOIN locations l ON a.location_id = l.id
      WHERE a.id = $1
    `, [req.params.id]);
        if (!rows[0]) return res.status(404).json({ error: 'Asset not found' });
        res.json(rows[0]);
    } catch (_err) {
        console.error(_err);
        res.status(500).json({ error: 'Server error' });
    }
});

// POST create asset
router.post('/', verifyToken, requireAdmin, async (req, res) => {
    const { name, serial_number, model, category_id, location_id, status, purchase_date, notes } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });
    try {
        const { rows } = await pool.query(`
      INSERT INTO assets (name, serial_number, model, category_id, location_id, status, purchase_date, notes)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *
    `, [name, serial_number, model, category_id, location_id, status || 'active', purchase_date, notes]);
        res.status(201).json(rows[0]);
    } catch (_err) {
        console.error(_err);
        res.status(500).json({ error: 'Server error' });
    }
});

// PATCH update asset
router.patch('/:id', verifyToken, requireAdmin, async (req, res) => {
    const { name, serial_number, model, category_id, location_id, status, purchase_date, notes } = req.body;
    try {
        const { rows } = await pool.query(`
      UPDATE assets SET
        name=$1, serial_number=$2, model=$3, category_id=$4,
        location_id=$5, status=$6, purchase_date=$7, notes=$8,
        updated_at=NOW()
      WHERE id=$9 RETURNING *
    `, [name, serial_number, model, category_id, location_id, status, purchase_date, notes, req.params.id]);
        if (!rows[0]) return res.status(404).json({ error: 'Asset not found' });
        res.json(rows[0]);
    } catch (_err) {
        console.error(_err);
        res.status(500).json({ error: 'Server error' });
    }
});

// DELETE asset
router.delete('/:id', verifyToken, requireAdmin, async (req, res) => {
    try {
        await pool.query('DELETE FROM assets WHERE id = $1', [req.params.id]);
        res.json({ deleted: true });
    } catch (_err) {
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;