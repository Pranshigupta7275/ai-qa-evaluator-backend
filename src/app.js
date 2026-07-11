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
const orchestratorRoutes = require('./routes/orchestrator.routes');

const app = express(); // 👈 Essential: You must define 'app'

// 1. Unified Body Parsing (Declare ONCE)
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// 2. Secure application HTTP response headers
app.use(helmet());

// 3. Cross-Origin Resource Sharing setup
app.use(cors({
  origin: env.ALLOWED_ORIGINS,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// 4. Morgan Logging
const morganFormat = env.NODE_ENV === 'production' ? 'combined' : 'dev';
app.use(morgan(morganFormat, {
  stream: { write: (message) => logger.info(message.trim()) }
}));

// 5. Routes
app.use('/api/v1', routes);
app.use('/api/v1/orchestrator', orchestratorRoutes);

app.post('/api/test-body', (req, res) => {
    console.log("🔥 DIRECT TEST ROUTE HIT!");
    console.log("🔥 BODY:", req.body);
    
    if (Object.keys(req.body).length === 0) {
        return res.status(400).json({ error: "Still empty!" });
    }
    return res.status(200).json({ success: true, receivedData: req.body });
});

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;