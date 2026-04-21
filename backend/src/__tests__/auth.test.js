const request = require('supertest');
const app = require('../app');
const { pool, createSchema, seedUsers, cleanDb, authHeader } = require('./helpers');

let admin, tech;

// ─────────────────────────────────────────────────────────────
// Setup / teardown
// ─────────────────────────────────────────────────────────────
beforeAll(async () => {
    await createSchema();
    ({ admin, tech } = await seedUsers());
});

afterAll(async () => {
    await cleanDb();
    await pool.end();
});

// ─────────────────────────────────────────────────────────────
// POST /api/auth/login
// ─────────────────────────────────────────────────────────────
describe('POST /api/auth/login', () => {
    it('returns 400 when body is empty', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({});

        expect(res.statusCode).toBe(400);
        expect(res.body.error).toBeDefined();
    });

    it('returns 400 when email is missing', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({ password: 'Password123!' });

        expect(res.statusCode).toBe(400);
    });

    it('returns 400 when password is missing', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: 'admin@test.local' });

        expect(res.statusCode).toBe(400);
    });

    it('returns 401 when email does not exist', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: 'nobody@nowhere.com', password: 'Password123!' });

        expect(res.statusCode).toBe(401);
    });

    it('returns 401 when password is wrong', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: 'admin@test.local', password: 'wrongpassword' });

        expect(res.statusCode).toBe(401);
    });

    it('returns 200 with token and user on valid credentials', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: 'admin@test.local', password: 'Password123!' });

        expect(res.statusCode).toBe(200);
        expect(res.body.token).toBeDefined();
        expect(typeof res.body.token).toBe('string');
    });

    it('returned user has the correct shape (no password_hash)', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: 'admin@test.local', password: 'Password123!' });

        const { user } = res.body;
        expect(user.id).toBeDefined();
        expect(user.name).toBe('Admin User');
        expect(user.email).toBe('admin@test.local');
        expect(user.role).toBe('admin');
        expect(user.password_hash).toBeUndefined();
    });

    it('works for a technician role too', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: 'tech@test.local', password: 'Password123!' });

        expect(res.statusCode).toBe(200);
        expect(res.body.user.role).toBe('technician');
    });
});

// ─────────────────────────────────────────────────────────────
// GET /api/auth/me
// ─────────────────────────────────────────────────────────────
describe('GET /api/auth/me', () => {
    it('returns 401 with no token', async () => {
        const res = await request(app).get('/api/auth/me');
        expect(res.statusCode).toBe(401);
    });

    it('returns 401 with a garbage token', async () => {
        const res = await request(app)
            .get('/api/auth/me')
            .set('Authorization', 'Bearer not-a-real-token');
        expect(res.statusCode).toBe(401);
    });

    it('returns 200 and the user payload when token is valid', async () => {
        const res = await request(app)
            .get('/api/auth/me')
            .set(authHeader(admin));

        expect(res.statusCode).toBe(200);
        expect(res.body.user).toBeDefined();
        expect(res.body.user.id).toBe(admin.id);
        expect(res.body.user.role).toBe('admin');
    });
});