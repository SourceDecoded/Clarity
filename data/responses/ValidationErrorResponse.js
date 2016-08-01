"use strict";
const ErrorResponse = require("./ErrorResponse");
class ValidationErrorResponse extends ErrorResponse {
    constructor(message, validationErrors) {
        super(message);
    }
}
module.exports = ValidationErrorResponse;
//# sourceMappingURL=ValidationErrorResponse.js.map