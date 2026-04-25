const express = require('express');
const cors    = require('cors');
const helmet  = require('helmet');
const morgan  = require('morgan');
const {metricsMiddleware,metricsHandler} = require('./middleware/metrics');
require('dotenv').config();

const app = express();

app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(metricsMiddleware);


// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// Metrics endpoint
app.get('/metrics', metricsHandler);

// Routes
app.use('/api/auth',        require('./routes/auth'));
app.use('/api/assets',      require('./routes/assets'));
app.use('/api/work-orders', require('./routes/workOrders'));
app.use('/api/schedules',   require('./routes/schedules'));
app.use('/api/users',       require('./routes/users'));
app.use('/api/dashboard',   require('./routes/dashboard'));

module.exports = app;