require('express-async-errors');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const env = require('./config/env');
const routes = require('./routes');
const { notFound, errorHandler } = require('./shared/middleware/error');

const app = express();

app.use(helmet());
app.use(cors({ origin: env.CLIENT_ORIGIN.split(',').map((s) => s.trim()), credentials: true }));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
if (env.NODE_ENV !== 'test') app.use(morgan('dev'));

app.use('/api', rateLimit({ windowMs: 60 * 1000, max: 600 }));
app.use('/api', routes);

app.get('/health', (_req, res) => res.json({ status: 'ok', uptime: process.uptime() }));

app.use(notFound);
app.use(errorHandler);

module.exports = app;
