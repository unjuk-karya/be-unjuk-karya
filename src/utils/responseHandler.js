class BaseError extends Error {
  constructor(message, status, errors = {}) {
    super(message);
    this.name = this.constructor.name;
    this.status = status;
    this.errors = errors;
  }
}

class ValidationError extends BaseError {
  constructor(errors) {
    super("The given data was invalid.", 422, errors);
  }
}

const createErrorResponse = (error) => ({
  status: error.status || 500,
  message: error.message,
  errors: error.errors || {}
});

const createSuccessResponse = (data, message = "Success", status = 200) => ({
  status,
  message,
  data
});

const handleValidation = (fields) => {
  const errors = Object.keys(fields).reduce((acc, field) => {
    const { value, message } = fields[field];
    if (!value) acc[field] = [message];
    return acc;
  }, {});

  if (Object.keys(errors).length > 0) throw new ValidationError(errors);
};

module.exports = {
  ValidationError,
  createErrorResponse,
  createSuccessResponse,
  handleValidation
};
