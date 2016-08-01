"use strict";
var global = (function () { return this; })();
module.exports = function (namespace, context) {
    if (typeof namespace !== "string") {
        throw new Error("namespace: this function only accepts strings.");
    }
    var obj = namespace;
    var a = obj.split(".");
    var length = a.length;
    var tmpObj = context || global;
    var built = false;
    for (var x = 0; x < length; x++) {
        if (typeof tmpObj[a[x]] === "undefined") {
            tmpObj = tmpObj[a[x]] = {};
            built = true;
        }
        else {
            tmpObj = tmpObj[a[x]];
        }
    }
    return built;
};
//# sourceMappingURL=createNamespace.js.map