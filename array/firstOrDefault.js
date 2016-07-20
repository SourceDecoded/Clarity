"use strict";
var firstOrDefault = function (array, expr) {
    if (typeof expr === "function") {
        array = array.filter(expr);
    }
    return typeof array[0] === "undefined" ? null : array[0];
};
Array.prototype.firstOrDefault = function (expr) {
    return firstOrDefault(this, expr);
};
module.exports = firstOrDefault;
//# sourceMappingURL=firstOrDefault.js.map