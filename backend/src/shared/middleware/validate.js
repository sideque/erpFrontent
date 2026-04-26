const ApiError = require('../utils/ApiError');

function validate(schema, source = 'body') {
  return (req, _res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      const details = {};
      for (const issue of result.error.issues) {
        const key = issue.path.join('.') || '_';
        details[key] = issue.message;
      }
      throw ApiError.badRequest('Validation failed', details);
    }
    req[source] = result.data;
    next();
  };
}

module.exports = { validate };
