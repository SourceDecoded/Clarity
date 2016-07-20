import ServiceResponse = require("./ServiceResponse");

class AddedResponse extends ServiceResponse {
    message: string;
    entity: any;
    constructor(message, entity) {
        super(message);
        this.entity = entity;
    }
}

export = AddedResponse;