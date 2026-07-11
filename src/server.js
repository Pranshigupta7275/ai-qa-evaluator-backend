require('dotenv').config();
const app = require('./app');
const env = require('./config/env');
const logger = require('./config/logger');
const connectDB = require('./config/db');

const PORT = env.PORT || 8080;

// 👉 FIRE UP THE DATABASE CONNECTION
connectDB();

try {
  const server = app.listen(PORT, () => {
    logger.info(`🚀 Server running in [${env.NODE_ENV}] mode on port: ${PORT}`);
  });

  const handleTermination = (signal) => {
    logger.warn(`Received ${signal}. Starting safe structural termination routine...`);
    server.close(() => {
      logger.info('Process connection pools closed gracefully. Exiting system context.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => handleTermination('SIGTERM'));
  process.on('SIGINT', () => handleTermination('SIGINT'));

} catch (error) {
  logger.error('💥 Critical Error during server initialization:', error);
  process.exit(1);
}

process.on('unhandledRejection', (reason, promise) => {
  // Captured the promise data inside the logger so no context is lost
  logger.error('Unhandled Promise Rejection pinned at context:', { reason, promise });
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception captured outside runtime core context:', error);
  process.exit(1);
});