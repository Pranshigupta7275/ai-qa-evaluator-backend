const env = require('../config/env');
const logger = require('../config/logger');
const ApiError = require('../utils/ApiError');

const errorHandler = (err, req, res, next) => {
  let { statusCode, message, errorCode, details } = err;

  if (!(err instanceof ApiError)) {
    statusCode = 500;
    message = 'Internal Server Error';
    errorCode = 'INTERNAL_SERVER_ERROR';
    details = [];
  }

  // FORCE FACT: If there's an underlying error message captured, append it to details
  if (err.message && err.statusCode === 502) {
    details = [err.message];
  }

  logger.error(`${statusCode} - ${message} - ${req.originalUrl} - ${req.method} - ${req.ip}`, {
    stack: err.stack,
    details: err.details
  });

  const responseBody = {
    success: false,
    message,
    data: null,
    error: {
      code: errorCode,
      // If we are in development, pass the raw error text into details so we can read it in Postman
      details: err.details && err.details.length ? err.details : [err.toString()]
    }
  };

  return res.status(statusCode).json(responseBody);
};

module.exports = errorHandler;