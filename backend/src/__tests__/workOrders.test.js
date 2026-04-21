const request = require('supertest');
const app = require('../app');
const { pool, createSchema, seedUsers, seedAsset, cleanDb, authHeader } = require('./helpers');

let admin, tech, asset;
let workOrderId;

beforeAll(async () => {
    await createSchema();
    ({ admin, tech } = await seedUsers());
    asset = await seedAsset('HVAC Unit');
});

afterAll(async () => {
    await cleanDb();
    await pool.end();
});

// ─────────────────────────────────────────────────────────────
// GET /api/work-orders
// ─────────────────────────────────────────────────────────────
describe('GET /api/work-orders', () => {
    it('returns 401 with no token', async () => {
        const res = await request(app).get('/api/work-orders');
        expect(res.statusCode).toBe(401);
    });

    it('returns 200 and an array', async () => {
        const res = await request(app)
            .get('/api/work-orders')
            .set(authHeader(admin));

        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
    });

    it('technician can list work orders', async () => {
        const res = await request(app)
            .get('/api/work-orders')
            .set(authHeader(tech));

        expect(res.statusCode).toBe(200);
    });
});

// ─────────────────────────────────────────────────────────────
// POST /api/work-orders
// ─────────────────────────────────────────────────────────────
describe('POST /api/work-orders', () => {
    it('returns 401 with no token', async () => {
        const res = await request(app)
            .post('/api/work-orders')
            .send({ title: 'Fix HVAC' });

        expect(res.statusCode).toBe(401);
    });

    it('returns 400 when title is missing', async () => {
        const res = await request(app)
            .post('/api/work-orders')
            .set(authHeader(admin))
            .send({ asset_id: asset.id });

        expect(res.statusCode).toBe(400);
        expect(res.body.error).toBeDefined();
    });

    it('creates a work order and returns 201', async () => {
        const res = await request(app)
            .post('/api/work-orders')
            .set(authHeader(admin))
            .send({
                title: 'Fix HVAC filter',
                description: 'Replace filter on rooftop unit',
                asset_id: asset.id,
                assigned_to: tech.id,
                priority: 'high',
            });

        expect(res.statusCode).toBe(201);
        expect(res.body.id).toBeDefined();
        expect(res.body.title).toBe('Fix HVAC filter');
        expect(res.body.priority).toBe('high');
        expect(res.body.status).toBe('open');

        workOrderId = res.body.id;
    });

    it('sets created_by from the JWT, not the request body', async () => {
        const res = await request(app)
            .post('/api/work-orders')
            .set(authHeader(admin))
            .send({ title: 'Check wiring' });

        expect(res.body.created_by).toBe(admin.id);
    });

    it('defaults priority to "medium" when not provided', async () => {
        const res = await request(app)
            .post('/api/work-orders')
            .set(authHeader(tech))
            .send({ title: 'Routine inspection' });

        expect(res.statusCode).toBe(201);
        expect(res.body.priority).toBe('medium');
    });

    it('technician can also create a work order', async () => {
        const res = await request(app)
            .post('/api/work-orders')
            .set(authHeader(tech))
            .send({ title: 'Lubricate conveyor belt' });

        expect(res.statusCode).toBe(201);
        expect(res.body.created_by).toBe(tech.id);
    });
});

// ─────────────────────────────────────────────────────────────
// GET /api/work-orders/:id
// ─────────────────────────────────────────────────────────────
describe('GET /api/work-orders/:id', () => {
    it('returns 404 for unknown id', async () => {
        const res = await request(app)
            .get('/api/work-orders/999999')
            .set(authHeader(admin));

        expect(res.statusCode).toBe(404);
    });

    it('returns the work order with a comments array', async () => {
        const res = await request(app)
            .get(`/api/work-orders/${workOrderId}`)
            .set(authHeader(admin));

        expect(res.statusCode).toBe(200);
        expect(res.body.id).toBe(workOrderId);
        expect(Array.isArray(res.body.comments)).toBe(true);
    });
});

// ─────────────────────────────────────────────────────────────
// PATCH /api/work-orders/:id
// ─────────────────────────────────────────────────────────────
describe('PATCH /api/work-orders/:id', () => {
    it('returns 404 for unknown id', async () => {
        const res = await request(app)
            .patch('/api/work-orders/999999')
            .set(authHeader(admin))
            .send({ title: 'Ghost', status: 'open', priority: 'low' });

        expect(res.statusCode).toBe(404);
    });

    it('updates status to "in_progress"', async () => {
        const res = await request(app)
            .patch(`/api/work-orders/${workOrderId}`)
            .set(authHeader(tech))
            .send({
                title: 'Fix HVAC filter',
                status: 'in_progress',
                priority: 'high',
            });

        expect(res.statusCode).toBe(200);
        expect(res.body.status).toBe('in_progress');
    });

    it('sets completed_at when status becomes "done"', async () => {
        const res = await request(app)
            .patch(`/api/work-orders/${workOrderId}`)
            .set(authHeader(tech))
            .send({
                title: 'Fix HVAC filter',
                status: 'done',
                priority: 'high',
            });

        expect(res.statusCode).toBe(200);
        expect(res.body.status).toBe('done');
        expect(res.body.completed_at).not.toBeNull();
    });

    it('technician can update a work order', async () => {
        // Create a fresh one first
        const create = await request(app)
            .post('/api/work-orders')
            .set(authHeader(tech))
            .send({ title: 'Technician WO' });

        const res = await request(app)
            .patch(`/api/work-orders/${create.body.id}`)
            .set(authHeader(tech))
            .send({ title: 'Technician WO', status: 'in_progress', priority: 'low' });

        expect(res.statusCode).toBe(200);
    });
});

// ─────────────────────────────────────────────────────────────
// POST /api/work-orders/:id/comments
// ─────────────────────────────────────────────────────────────
describe('POST /api/work-orders/:id/comments', () => {
    it('returns 401 with no token', async () => {
        const res = await request(app)
            .post(`/api/work-orders/${workOrderId}/comments`)
            .send({ body: 'Started work' });

        expect(res.statusCode).toBe(401);
    });

    it('returns 400 when comment body is missing', async () => {
        const res = await request(app)
            .post(`/api/work-orders/${workOrderId}/comments`)
            .set(authHeader(admin))
            .send({});

        expect(res.statusCode).toBe(400);
    });

    it('creates a comment and returns 201', async () => {
        const res = await request(app)
            .post(`/api/work-orders/${workOrderId}/comments`)
            .set(authHeader(admin))
            .send({ body: 'Filter replaced, unit running normally.' });

        expect(res.statusCode).toBe(201);
        expect(res.body.id).toBeDefined();
        expect(res.body.body).toBe('Filter replaced, unit running normally.');
        expect(res.body.user_id).toBe(admin.id);
    });

    it('comment appears in the work order detail response', async () => {
        const res = await request(app)
            .get(`/api/work-orders/${workOrderId}`)
            .set(authHeader(admin));

        expect(res.body.comments.length).toBeGreaterThan(0);
        expect(res.body.comments[0].body).toBe('Filter replaced, unit running normally.');
    });
});

// ─────────────────────────────────────────────────────────────
// DELETE /api/work-orders/:id
// ─────────────────────────────────────────────────────────────
describe('DELETE /api/work-orders/:id', () => {
    it('returns 403 when a technician tries to delete', async () => {
        const res = await request(app)
            .delete(`/api/work-orders/${workOrderId}`)
            .set(authHeader(tech));

        expect(res.statusCode).toBe(403);
    });

    it('admin can delete a work order', async () => {
        const res = await request(app)
            .delete(`/api/work-orders/${workOrderId}`)
            .set(authHeader(admin));

        expect(res.statusCode).toBe(200);
        expect(res.body.deleted).toBe(true);
    });

    it('work order is gone after deletion', async () => {
        const res = await request(app)
            .get(`/api/work-orders/${workOrderId}`)
            .set(authHeader(admin));

        expect(res.statusCode).toBe(404);
    });
});