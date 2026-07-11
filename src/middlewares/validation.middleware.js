const ApiError = require('../utils/ApiError');

const validate = (schema) => (req, res, next) => {
  // Failsafe: Catch import mismatches immediately
  if (!schema || typeof schema.safeParse !== 'function') {
    console.error('💥 VALIDATION CRASH: The schema passed to the middleware is not a valid Zod object. Did you forget curly braces in your require() statement?');
    console.error('Received schema type:', typeof schema);
    return next(new ApiError(500, 'Server configuration error in route validation', 'VALIDATION_CONFIG_ERROR'));
  }

  const result = schema.safeParse({
    body: req.body,
    query: req.query,
    params: req.params
  });

  if (!result.success) {
    const details = result.error.errors.map(err => ({
      field: err.path.join('.').replace('body.', ''),
      message: err.message
    }));

    return next(new ApiError(400, 'Validation Failed', 'VALIDATION_ERROR', details));
  }

  // Assign validated data back to the request
  if (result.data.body) req.body = result.data.body;
  if (result.data.query) req.query = result.data.query;
  if (result.data.params) req.params = result.data.params;

  return next();
  console.log("BODY:", req.body);
};

module.exports = validate;