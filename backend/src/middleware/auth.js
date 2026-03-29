const jwt = require('jsonwebtoken');

function verifyToken(req, res, next) {
    const header = req.headers['authorization'];
    if (!header) return res.status(401).json({ error: 'No token provided' });

    const token = header.split(' ')[1]; // "Bearer <token>"
    if (!token) return res.status(401).json({ error: 'Malformed token' });

    try {
        req.user = jwt.verify(token, process.env.JWT_SECRET);
        next();
    } catch {
        res.status(401).json({ error: 'Invalid or expired token' });
    }
}

function requireAdmin(req, res, next) {
    if (req.user?.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
    }
    next();
}

module.exports = { verifyToken, requireAdmin };