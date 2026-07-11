const ApiError = require('../utils/ApiError');

const notFoundHandler = (req, res, next) => {
  next(new ApiError(404, `Route not found - ${req.originalUrl}`, 'ROUTE_NOT_FOUND'));
};

module.exports = notFoundHandler;