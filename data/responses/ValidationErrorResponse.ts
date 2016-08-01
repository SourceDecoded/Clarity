import ErrorResponse = require("./ErrorResponse");

class ValidationErrorResponse extends ErrorResponse {
    errors;
    constructor(message, validationErrors) {
        super(message);
    }
}

export = ValidationErrorResponse;
