const express = require('express');
const cors    = require('cors');
const helmet  = require('helmet');
const morgan  = require('morgan');
require('dotenv').config();

const app = express();

app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// Routes
app.use('/api/auth',        require('./routes/auth'));
app.use('/api/assets',      require('./routes/assets'));
app.use('/api/work-orders', require('./routes/workOrders'));
app.use('/api/schedules',   require('./routes/schedules'));
app.use('/api/users',       require('./routes/users'));
app.use('/api/dashboard',   require('./routes/dashboard'));

module.exports = app;