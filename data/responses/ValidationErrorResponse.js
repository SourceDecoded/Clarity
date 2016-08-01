"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var ErrorResponse = require("./ErrorResponse");
var ValidationErrorResponse = (function (_super) {
    __extends(ValidationErrorResponse, _super);
    function ValidationErrorResponse(message, validationErrors) {
        _super.call(this, message);
    }
    return ValidationErrorResponse;
}(ErrorResponse));
module.exports = ValidationErrorResponse;
//# sourceMappingURL=ValidationErrorResponse.js.map