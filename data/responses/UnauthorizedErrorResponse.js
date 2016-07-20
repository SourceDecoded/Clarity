"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var ErrorResponse = require("./ErrorResponse");
var UnauthorizedErrorResponse = (function (_super) {
    __extends(UnauthorizedErrorResponse, _super);
    function UnauthorizedErrorResponse() {
        _super.apply(this, arguments);
    }
    return UnauthorizedErrorResponse;
}(ErrorResponse));
module.exports = UnauthorizedErrorResponse;
//# sourceMappingURL=UnauthorizedErrorResponse.js.map