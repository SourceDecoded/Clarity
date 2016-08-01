import ErrorResponse = require("./ErrorResponse");

class EntityNotFoundErrorResponse extends ErrorResponse {
    message: string;
    entity: any;
    constructor(message, entity?) {
        super(message);
        this.entity = entity;
    }
}

export = EntityNotFoundErrorResponse;