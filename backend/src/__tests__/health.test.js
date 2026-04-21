const request = require('supertest');
const app = require('../app');

describe('GET api/health', () => {
    it('returns 200', async () => {
        const res = await request(app).get('/api/health');
        expect(res.statusCode).toBe(200);
    });
    it('returns { status: "ok" }', async () => {
        const res = await request(app).get('/api/health');
        expect(res.body).toEqual({ status: 'ok' });
    });
    it('responds as JSON', async () => {
        const res = await request(app).get('/api/health');
        expect(res.headers['content-type']).toMatch(/json/);
    });
});
