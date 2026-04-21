const request = require('supertest');
const app = require('../app');
const { pool, createSchema, seedUsers, seedAsset, cleanDb, authHeader } = require('./helpers');

let admin, tech, asset;

beforeAll(async () => {
    await createSchema();
    ({ admin, tech } = await seedUsers());
    asset = await seedAsset('Dashboard Test Asset');

    // Seed a couple of work orders so the dashboard has data
    await pool.query(
        `INSERT INTO work_orders (title, asset_id, created_by, status, priority)
     VALUES ($1, $2, $3, 'open', 'medium'), ($4, $2, $3, 'done', 'low')`,
        ['Open WO', asset.id, admin.id, 'Done WO']
    );
});

afterAll(async () => {
    await cleanDb();
    await pool.end();
});

// ─────────────────────────────────────────────────────────────
// GET /api/dashboard
// ─────────────────────────────────────────────────────────────
describe('GET /api/dashboard', () => {
    it('returns 401 with no token', async () => {
        const res = await request(app).get('/api/dashboard');
        expect(res.statusCode).toBe(401);
    });

    it('returns 200 for an authenticated user', async () => {
        const res = await request(app)
            .get('/api/dashboard')
            .set(authHeader(admin));

        expect(res.statusCode).toBe(200);
    });

    it('returns all expected top-level fields', async () => {
        const res = await request(app)
            .get('/api/dashboard')
            .set(authHeader(admin));

        expect(res.body).toHaveProperty('total_assets');
        expect(res.body).toHaveProperty('open_work_orders');
        expect(res.body).toHaveProperty('overdue');
        expect(res.body).toHaveProperty('recent_work_orders');
        expect(res.body).toHaveProperty('by_status');
    });

    it('numeric fields are integers, not strings', async () => {
        const res = await request(app)
            .get('/api/dashboard')
            .set(authHeader(admin));

        // The route casts COUNT() results with parseInt() — verify that
        expect(typeof res.body.total_assets).toBe('number');
        expect(typeof res.body.open_work_orders).toBe('number');
        expect(typeof res.body.overdue).toBe('number');
    });

    it('total_assets reflects seeded data', async () => {
        const res = await request(app)
            .get('/api/dashboard')
            .set(authHeader(admin));

        expect(res.body.total_assets).toBeGreaterThanOrEqual(1);
    });

    it('recent_work_orders is an array with at most 5 items', async () => {
        const res = await request(app)
            .get('/api/dashboard')
            .set(authHeader(tech));

        expect(Array.isArray(res.body.recent_work_orders)).toBe(true);
        expect(res.body.recent_work_orders.length).toBeLessThanOrEqual(5);
    });

    it('by_status is an array of objects with status and count fields', async () => {
        const res = await request(app)
            .get('/api/dashboard')
            .set(authHeader(admin));

        expect(Array.isArray(res.body.by_status)).toBe(true);
        res.body.by_status.forEach(row => {
            expect(row).toHaveProperty('status');
            expect(row).toHaveProperty('count');
        });
    });

    it('technician can also access the dashboard', async () => {
        const res = await request(app)
            .get('/api/dashboard')
            .set(authHeader(tech));

        expect(res.statusCode).toBe(200);
    });
});