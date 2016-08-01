"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var ErrorResponse = require("./ErrorResponse");
var EntityNotFoundErrorResponse = (function (_super) {
    __extends(EntityNotFoundErrorResponse, _super);
    function EntityNotFoundErrorResponse(message, entity) {
        _super.call(this, message);
        this.entity = entity;
    }
    return EntityNotFoundErrorResponse;
}(ErrorResponse));
module.exports = EntityNotFoundErrorResponse;
//# sourceMappingURL=EntityNotFoundErrorResponse.js.map