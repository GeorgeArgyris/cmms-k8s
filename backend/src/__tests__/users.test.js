const request = require('supertest');
const app = require('../app');
const { pool, createSchema, seedUsers, cleanDb, authHeader } = require('./helpers');

let admin, tech;
let createdUserId;

beforeAll(async () => {
    await createSchema();
    ({ admin, tech } = await seedUsers());
});

afterAll(async () => {
    await cleanDb();
    await pool.end();
});

// ─────────────────────────────────────────────────────────────
// GET /api/users
// ─────────────────────────────────────────────────────────────
describe('GET /api/users', () => {
    it('returns 401 with no token', async () => {
        const res = await request(app).get('/api/users');
        expect(res.statusCode).toBe(401);
    });

    it('returns 403 for a technician', async () => {
        const res = await request(app)
            .get('/api/users')
            .set(authHeader(tech));

        expect(res.statusCode).toBe(403);
    });

    it('returns 200 and an array for an admin', async () => {
        const res = await request(app)
            .get('/api/users')
            .set(authHeader(admin));

        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
    });

    it('does not expose password_hash in the list', async () => {
        const res = await request(app)
            .get('/api/users')
            .set(authHeader(admin));

        res.body.forEach(user => {
            expect(user.password_hash).toBeUndefined();
        });
    });
});

// ─────────────────────────────────────────────────────────────
// POST /api/users
// ─────────────────────────────────────────────────────────────
describe('POST /api/users', () => {
    it('returns 403 for a technician', async () => {
        const res = await request(app)
            .post('/api/users')
            .set(authHeader(tech))
            .send({ name: 'X', email: 'x@x.com', password: 'pass' });

        expect(res.statusCode).toBe(403);
    });

    it('returns 400 when name is missing', async () => {
        const res = await request(app)
            .post('/api/users')
            .set(authHeader(admin))
            .send({ email: 'new@test.local', password: 'pass' });

        expect(res.statusCode).toBe(400);
    });

    it('returns 400 when email is missing', async () => {
        const res = await request(app)
            .post('/api/users')
            .set(authHeader(admin))
            .send({ name: 'New Guy', password: 'pass' });

        expect(res.statusCode).toBe(400);
    });

    it('returns 400 when password is missing', async () => {
        const res = await request(app)
            .post('/api/users')
            .set(authHeader(admin))
            .send({ name: 'New Guy', email: 'new@test.local' });

        expect(res.statusCode).toBe(400);
    });

    it('creates a user and returns 201 without password_hash', async () => {
        const res = await request(app)
            .post('/api/users')
            .set(authHeader(admin))
            .send({
                name: 'New Technician',
                email: 'newtech@test.local',
                password: 'SecurePass1!',
                role: 'technician',
            });

        expect(res.statusCode).toBe(201);
        expect(res.body.id).toBeDefined();
        expect(res.body.name).toBe('New Technician');
        expect(res.body.role).toBe('technician');
        expect(res.body.password_hash).toBeUndefined();

        createdUserId = res.body.id;
    });

    it('defaults role to "technician" when not provided', async () => {
        const res = await request(app)
            .post('/api/users')
            .set(authHeader(admin))
            .send({
                name: 'Default Role',
                email: 'defaultrole@test.local',
                password: 'pass',
            });

        expect(res.statusCode).toBe(201);
        expect(res.body.role).toBe('technician');
    });

    it('returns 400 on duplicate email', async () => {
        const res = await request(app)
            .post('/api/users')
            .set(authHeader(admin))
            .send({
                name: 'Duplicate',
                email: 'newtech@test.local', // same email as created above
                password: 'pass',
            });

        expect(res.statusCode).toBe(400);
        expect(res.body.error).toMatch(/already exists/i);
    });
});

// ─────────────────────────────────────────────────────────────
// PATCH /api/users/:id
// ─────────────────────────────────────────────────────────────
describe('PATCH /api/users/:id', () => {
    it('returns 403 for a technician', async () => {
        const res = await request(app)
            .patch(`/api/users/${createdUserId}`)
            .set(authHeader(tech))
            .send({ name: 'Hacked', role: 'admin', is_active: true });

        expect(res.statusCode).toBe(403);
    });

    it('admin can update name and role', async () => {
        const res = await request(app)
            .patch(`/api/users/${createdUserId}`)
            .set(authHeader(admin))
            .send({ name: 'Senior Technician', role: 'technician', is_active: true });

        expect(res.statusCode).toBe(200);
        expect(res.body.name).toBe('Senior Technician');
    });

    it('admin can deactivate a user', async () => {
        const res = await request(app)
            .patch(`/api/users/${createdUserId}`)
            .set(authHeader(admin))
            .send({ name: 'Senior Technician', role: 'technician', is_active: false });

        expect(res.statusCode).toBe(200);
        expect(res.body.is_active).toBe(false);
    });

    it('returns 404 for a non-existent user', async () => {
        const res = await request(app)
            .patch('/api/users/999999')
            .set(authHeader(admin))
            .send({ name: 'Ghost', role: 'technician', is_active: true });

        expect(res.statusCode).toBe(404);
    });
});