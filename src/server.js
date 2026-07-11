require('dotenv').config();
const app = require('./app');
const env = require('./config/env');
const logger = require('./config/logger');

const PORT = env.PORT || 8080;

try {
  const server = app.listen(PORT, () => {
    logger.info(` Server running in [${env.NODE_ENV}] mode on port: ${PORT}`);
    console.log(`Server running in [${env.NODE_ENV}] mode on port: ${PORT}`);
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
  console.error('💥 Critical Error during server initialization:', error);
  logger.error('💥 Critical Error during server initialization:', error);
  process.exit(1);
}

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  logger.error('Unhandled Promise Rejection pinned at context:', { reason });
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  logger.error('Uncaught Exception captured outside runtime core context:', error);
  process.exit(1);
});