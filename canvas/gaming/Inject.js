"use strict";
module.exports = (types) => {
    return (target) => {
        if (typeof target === "function") {
            target.dependencies = types;
        }
    };
};
//# sourceMappingURL=Inject.js.map