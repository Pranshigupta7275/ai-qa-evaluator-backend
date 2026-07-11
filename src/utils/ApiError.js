class ApiError extends Error {
  constructor(statusCode, message, errorCode = 'INTERNAL_SERVER_ERROR', details = []) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.details = details;
    this.success = false;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = ApiError;