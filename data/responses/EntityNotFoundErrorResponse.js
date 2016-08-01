"use strict";
const ErrorResponse = require("./ErrorResponse");
class EntityNotFoundErrorResponse extends ErrorResponse {
    constructor(message, entity) {
        super(message);
        this.entity = entity;
    }
}
module.exports = EntityNotFoundErrorResponse;
//# sourceMappingURL=EntityNotFoundErrorResponse.js.map