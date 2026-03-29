const express = require('express');
const router = express.Router();
const { verifyToken, requireAdmin } = require('../middleware/auth');
const pool = require('../db/pool');

// GET all work orders
router.get('/', verifyToken, async (req, res) => {
    try {
        const { rows } = await pool.query(`
      SELECT wo.*,
        a.name as asset_name,
        u.name as assigned_name
      FROM work_orders wo
      LEFT JOIN assets a ON wo.asset_id = a.id
      LEFT JOIN users u ON wo.assigned_to = u.id
      ORDER BY wo.created_at DESC
    `);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// GET single work order + comments
router.get('/:id', verifyToken, async (req, res) => {
    try {
        const { rows } = await pool.query(`
      SELECT wo.*, a.name as asset_name, u.name as assigned_name
      FROM work_orders wo
      LEFT JOIN assets a ON wo.asset_id = a.id
      LEFT JOIN users u ON wo.assigned_to = u.id
      WHERE wo.id = $1
    `, [req.params.id]);
        if (!rows[0]) return res.status(404).json({ error: 'Not found' });

        const comments = await pool.query(`
      SELECT c.*, u.name as user_name
      FROM work_order_comments c
      LEFT JOIN users u ON c.user_id = u.id
      WHERE c.work_order_id = $1
      ORDER BY c.created_at ASC
    `, [req.params.id]);

        res.json({ ...rows[0], comments: comments.rows });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// POST create work order
router.post('/', verifyToken, async (req, res) => {
    const { title, description, asset_id, assigned_to, priority, due_date } = req.body;
    if (!title) return res.status(400).json({ error: 'Title is required' });
    try {
        const { rows } = await pool.query(`
      INSERT INTO work_orders (title, description, asset_id, assigned_to, created_by, priority, due_date)
      VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *
    `, [title, description, asset_id, assigned_to, req.user.id, priority || 'medium', due_date]);
        res.status(201).json(rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// PATCH update work order
router.patch('/:id', verifyToken, async (req, res) => {
    const { title, description, asset_id, assigned_to, status, priority, due_date } = req.body;
    try {
        const completed_at = status === 'done' ? 'NOW()' : null;
        const { rows } = await pool.query(`
      UPDATE work_orders SET
        title=$1, description=$2, asset_id=$3, assigned_to=$4,
        status=$5, priority=$6, due_date=$7,
        completed_at = CASE WHEN $5 = 'done' THEN NOW() ELSE completed_at END,
        updated_at = NOW()
      WHERE id=$8 RETURNING *
    `, [title, description, asset_id, assigned_to, status, priority, due_date, req.params.id]);
        if (!rows[0]) return res.status(404).json({ error: 'Not found' });
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// DELETE work order
router.delete('/:id', verifyToken, requireAdmin, async (req, res) => {
    try {
        await pool.query('DELETE FROM work_orders WHERE id = $1', [req.params.id]);
        res.json({ deleted: true });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// POST add comment
router.post('/:id/comments', verifyToken, async (req, res) => {
    const { body } = req.body;
    if (!body) return res.status(400).json({ error: 'Comment body required' });
    try {
        const { rows } = await pool.query(`
      INSERT INTO work_order_comments (work_order_id, user_id, body)
      VALUES ($1,$2,$3) RETURNING *
    `, [req.params.id, req.user.id, body]);
        res.status(201).json(rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;