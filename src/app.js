require('express-async-errors');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');

const env = require('./config/env');
const logger = require('./config/logger');
const routes = require('./routes');
const notFoundHandler = require('./middlewares/notFound.middleware');
const errorHandler = require('./middlewares/error.middleware');

const app = express();


// Secure application HTTP response headers
app.use(helmet());

// Cross-Origin Resource Sharing setup
app.use(cors({
  origin: env.ALLOWED_ORIGINS,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Express built-in parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Dynamic Morgan integration mapping to Winston stream configurations
const morganFormat = env.NODE_ENV === 'production' ? 'combined' : 'dev';
app.use(morgan(morganFormat, {
  stream: { write: (message) => logger.info(message.trim()) }
}));

// Route registration context decoupling
app.use('/api/v1', routes);
app.use(express.urlencoded({ extended: true }));

// Central fallback intercept middleware maps
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;