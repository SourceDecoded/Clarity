"use strict";
module.exports = function (types) {
    return function (target) {
        if (typeof target === "function") {
            target.dependencies = types;
        }
    };
};
//# sourceMappingURL=Inject.js.map