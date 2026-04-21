const jwt = require('jsonwebtoken');
const { verifyToken, requireAdmin } = require('../middleware/auth');

process.env.JWT_SECRET = 'test-secret';

// ─────────────────────────────────────────────────────────────
// Test middleware without starting an HTTP server.
// ─────────────────────────────────────────────────────────────
function mockHttp({ headers = {}, user = null } = {}) {
    const req = { headers, user };
    const res = {
        _status: null,
        _body: null,
        status(code) { this._status = code; return this; },
        json(body) { this._body = body; return this; },
    };
    const next = jest.fn();
    return { req, res, next };
}

function makeValidToken(payload = { id: 1, name: 'Test', role: 'admin' }) {
    return jwt.sign(payload, 'test-secret', { expiresIn: '1h' });
}

// ─────────────────────────────────────────────────────────────
// verifyToken
// ─────────────────────────────────────────────────────────────
describe('verifyToken', () => {
    it('returns 401 when Authorization header is missing', () => {
        const { req, res, next } = mockHttp();
        verifyToken(req, res, next);

        expect(res._status).toBe(401);
        expect(next).not.toHaveBeenCalled();
    });

    it('returns 401 when header has no Bearer token', () => {
        const { req, res, next } = mockHttp({ headers: { authorization: 'Bearer ' } });
        verifyToken(req, res, next);

        expect(res._status).toBe(401);
        expect(next).not.toHaveBeenCalled();
    });

    it('returns 401 when token is completely invalid', () => {
        const { req, res, next } = mockHttp({ headers: { authorization: 'Bearer not-a-jwt' } });
        verifyToken(req, res, next);

        expect(res._status).toBe(401);
        expect(next).not.toHaveBeenCalled();
    });

    it('returns 401 when token is signed with the wrong secret', () => {
        const token = jwt.sign({ id: 1, role: 'admin' }, 'wrong-secret');
        const { req, res, next } = mockHttp({ headers: { authorization: `Bearer ${token}` } });
        verifyToken(req, res, next);

        expect(res._status).toBe(401);
        expect(next).not.toHaveBeenCalled();
    });

    it('returns 401 when token is expired', () => {
        const token = jwt.sign({ id: 1, role: 'admin' }, 'test-secret', { expiresIn: '-1s' });
        const { req, res, next } = mockHttp({ headers: { authorization: `Bearer ${token}` } });
        verifyToken(req, res, next);

        expect(res._status).toBe(401);
        expect(next).not.toHaveBeenCalled();
    });

    it('calls next() when token is valid', () => {
        const token = makeValidToken();
        const { req, res, next } = mockHttp({ headers: { authorization: `Bearer ${token}` } });
        verifyToken(req, res, next);

        expect(next).toHaveBeenCalledTimes(1);
        expect(res._status).toBeNull();
    });

    it('sets req.user with the correct payload', () => {
        const token = makeValidToken({ id: 42, name: 'George', role: 'admin' });
        const { req, res, next } = mockHttp({ headers: { authorization: `Bearer ${token}` } });
        verifyToken(req, res, next);

        expect(req.user.id).toBe(42);
        expect(req.user.name).toBe('George');
        expect(req.user.role).toBe('admin');
    });
});

// ─────────────────────────────────────────────────────────────
// requireAdmin
// ─────────────────────────────────────────────────────────────
describe('requireAdmin', () => {
    it('returns 403 when user is a technician', () => {
        const { req, res, next } = mockHttp({ user: { id: 1, role: 'technician' } });
        requireAdmin(req, res, next);

        expect(res._status).toBe(403);
        expect(next).not.toHaveBeenCalled();
    });

    it('returns 403 when req.user is null', () => {
        const { req, res, next } = mockHttp({ user: null });
        requireAdmin(req, res, next);

        expect(res._status).toBe(403);
        expect(next).not.toHaveBeenCalled();
    });

    it('calls next() when user is an admin', () => {
        const { req, res, next } = mockHttp({ user: { id: 1, role: 'admin' } });
        requireAdmin(req, res, next);

        expect(next).toHaveBeenCalledTimes(1);
        expect(res._status).toBeNull();
    });
});