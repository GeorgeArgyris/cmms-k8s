const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const pool = require('../db/pool');

router.get('/', verifyToken, async (req, res) => {
    try {
        const [assets, workOrders, overdue, recent] = await Promise.all([
            pool.query('SELECT COUNT(*) FROM assets'),
            pool.query("SELECT COUNT(*) FROM work_orders WHERE status NOT IN ('done','cancelled')"),
            pool.query("SELECT COUNT(*) FROM work_orders WHERE status NOT IN ('done','cancelled') AND due_date < CURRENT_DATE"),
            pool.query(`
        SELECT wo.*, a.name as asset_name, u.name as assigned_name
        FROM work_orders wo
        LEFT JOIN assets a ON wo.asset_id = a.id
        LEFT JOIN users u ON wo.assigned_to = u.id
        ORDER BY wo.created_at DESC LIMIT 5
      `)
        ]);

        const byStatus = await pool.query(`
      SELECT status, COUNT(*) as count
      FROM work_orders
      GROUP BY status
    `);

        res.json({
            total_assets: parseInt(assets.rows[0].count),
            open_work_orders: parseInt(workOrders.rows[0].count),
            overdue: parseInt(overdue.rows[0].count),
            recent_work_orders: recent.rows,
            by_status: byStatus.rows
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;