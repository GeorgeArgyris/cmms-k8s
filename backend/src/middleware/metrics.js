const client = require('prom-client');

const register = client.register;

client.collectDefaultMetrics({ register });

const totalHTTPRequests = new client.Counter({
    name: 'http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'route', 'status_code'],
    registers: [register],
});

const httpRequestDurationSeconds = new client.Histogram({
    name: 'http_request_duration_seconds',
    help: 'HTTP request duration in seconds',
    labelNames: ['method', 'route', 'status_code'],
    buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2, 5],
    registers: [register],
});

const httpRequestsInFlight = new client.Gauge({
    name: 'http_requests_in_flight',
    help: 'Number of HTTP requests currently being processed',
    registers: [register],
});

function metricsMiddleware(req, res, next) {
    if (req.path === '/metrics') return next();

    const start = process.hrtime.bigint();
    httpRequestsInFlight.inc();

    const route = req.route?.path ?? req.path;

    res.on('finish', () => {
        const durationSeconds = Number(process.hrtime.bigint() - start) / 1e9;
        const labels = {
            method: req.method,
            route,
            status_code: res.statusCode,
        };

        httpRequestsTotal.inc(labels);
        httpRequestDurationSeconds.observe(labels, durationSeconds);
        httpRequestsInFlight.dec();
    });

    next();
}

async function metricsHandler(req, res) {
    try {
        res.set('Content-Type', register.contentType);
        res.end(await register.metrics());
    } catch (err) {
        res.status(500).end(err.message);
    }
}

module.exports = { metricsMiddleware, metricsHandler };