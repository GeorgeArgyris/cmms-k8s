const request = require('supertest');
const app = require('../app');
const { pool, createSchema, seedUsers, cleanDb, authHeader } = require('./helpers');

let admin, tech;
let createdAssetId;

beforeAll(async () => {
    await createSchema();
    ({ admin, tech } = await seedUsers());
});

afterAll(async () => {
    await cleanDb();
    await pool.end();
});

// ─────────────────────────────────────────────────────────────
// GET /api/assets
// ─────────────────────────────────────────────────────────────
describe('GET /api/assets', () => {
    it('returns 401 with no token', async () => {
        const res = await request(app).get('/api/assets');
        expect(res.statusCode).toBe(401);
    });

    it('returns 200 and an array for an authenticated user', async () => {
        const res = await request(app)
            .get('/api/assets')
            .set(authHeader(admin));

        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
    });

    it('technician can also list assets', async () => {
        const res = await request(app)
            .get('/api/assets')
            .set(authHeader(tech));

        expect(res.statusCode).toBe(200);
    });
});

// ─────────────────────────────────────────────────────────────
// POST /api/assets
// ─────────────────────────────────────────────────────────────
describe('POST /api/assets', () => {
    it('returns 401 with no token', async () => {
        const res = await request(app)
            .post('/api/assets')
            .send({ name: 'New Pump' });

        expect(res.statusCode).toBe(401);
    });

    it('returns 403 when a technician tries to create', async () => {
        const res = await request(app)
            .post('/api/assets')
            .set(authHeader(tech))
            .send({ name: 'New Pump' });

        expect(res.statusCode).toBe(403);
    });

    it('returns 400 when name is missing', async () => {
        const res = await request(app)
            .post('/api/assets')
            .set(authHeader(admin))
            .send({ serial_number: 'SN-001' });

        expect(res.statusCode).toBe(400);
        expect(res.body.error).toBeDefined();
    });

    it('creates an asset and returns 201 with the new record', async () => {
        const res = await request(app)
            .post('/api/assets')
            .set(authHeader(admin))
            .send({
                name: 'Hydraulic Press',
                serial_number: 'HP-001',
                model: 'ProPress 3000',
                status: 'active',
                notes: 'Main floor press',
            });

        expect(res.statusCode).toBe(201);
        expect(res.body.id).toBeDefined();
        expect(res.body.name).toBe('Hydraulic Press');
        expect(res.body.status).toBe('active');

        createdAssetId = res.body.id;
    });
});

// ─────────────────────────────────────────────────────────────
// GET /api/assets/:id
// ─────────────────────────────────────────────────────────────
describe('GET /api/assets/:id', () => {
    it('returns 401 with no token', async () => {
        const res = await request(app).get('/api/assets/1');
        expect(res.statusCode).toBe(401);
    });

    it('returns 404 for a non-existent asset', async () => {
        const res = await request(app)
            .get('/api/assets/999999')
            .set(authHeader(admin));

        expect(res.statusCode).toBe(404);
    });

    it('returns the created asset by id', async () => {
        const res = await request(app)
            .get(`/api/assets/${createdAssetId}`)
            .set(authHeader(admin));

        expect(res.statusCode).toBe(200);
        expect(res.body.id).toBe(createdAssetId);
        expect(res.body.name).toBe('Hydraulic Press');
    });
});

// ─────────────────────────────────────────────────────────────
// PATCH /api/assets/:id
// ─────────────────────────────────────────────────────────────
describe('PATCH /api/assets/:id', () => {
    it('returns 403 when a technician tries to update', async () => {
        const res = await request(app)
            .patch(`/api/assets/${createdAssetId}`)
            .set(authHeader(tech))
            .send({ name: 'Hacked Name', status: 'active' });

        expect(res.statusCode).toBe(403);
    });

    it('updates the asset and returns the updated record', async () => {
        const res = await request(app)
            .patch(`/api/assets/${createdAssetId}`)
            .set(authHeader(admin))
            .send({
                name: 'Hydraulic Press (Updated)',
                status: 'maintenance',
                serial_number: 'HP-001',
                model: 'ProPress 3000',
            });

        expect(res.statusCode).toBe(200);
        expect(res.body.name).toBe('Hydraulic Press (Updated)');
        expect(res.body.status).toBe('maintenance');
    });

    it('returns 404 when updating a non-existent asset', async () => {
        const res = await request(app)
            .patch('/api/assets/999999')
            .set(authHeader(admin))
            .send({ name: 'Ghost', status: 'active' });

        expect(res.statusCode).toBe(404);
    });
});

// ─────────────────────────────────────────────────────────────
// DELETE /api/assets/:id
// ─────────────────────────────────────────────────────────────
describe('DELETE /api/assets/:id', () => {
    it('returns 403 when a technician tries to delete', async () => {
        const res = await request(app)
            .delete(`/api/assets/${createdAssetId}`)
            .set(authHeader(tech));

        expect(res.statusCode).toBe(403);
    });

    it('deletes the asset and returns { deleted: true }', async () => {
        const res = await request(app)
            .delete(`/api/assets/${createdAssetId}`)
            .set(authHeader(admin));

        expect(res.statusCode).toBe(200);
        expect(res.body.deleted).toBe(true);
    });

    it('asset is actually gone after deletion', async () => {
        const res = await request(app)
            .get(`/api/assets/${createdAssetId}`)
            .set(authHeader(admin));

        expect(res.statusCode).toBe(404);
    });
});