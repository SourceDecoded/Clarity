"use strict";
const ServiceResponse = require("./ServiceResponse");
class AddedResponse extends ServiceResponse {
    constructor(message, entity) {
        super(message);
        this.entity = entity;
    }
}
module.exports = AddedResponse;
//# sourceMappingURL=AddedResponse.js.map