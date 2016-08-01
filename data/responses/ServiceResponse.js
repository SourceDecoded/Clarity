"use strict";
var ServiceResponse = (function () {
    function ServiceResponse(message) {
        this.message = message;
    }
    ServiceResponse.prototype.toString = function () {
        return this.message;
    };
    return ServiceResponse;
}());
module.exports = ServiceResponse;
//# sourceMappingURL=ServiceResponse.js.map