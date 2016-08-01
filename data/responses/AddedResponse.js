"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var ServiceResponse = require("./ServiceResponse");
var AddedResponse = (function (_super) {
    __extends(AddedResponse, _super);
    function AddedResponse(message, entity) {
        _super.call(this, message);
        this.entity = entity;
    }
    return AddedResponse;
}(ServiceResponse));
module.exports = AddedResponse;
//# sourceMappingURL=AddedResponse.js.map