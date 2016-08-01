"use strict";
module.exports = function clone(object, deep) {
    if (deep === void 0) { deep = false; }
    var clonedObject;
    if (Array.isArray(object)) {
        clonedObject = [];
        object.forEach(function (item) {
            if (typeof item === "object" && item !== null && deep) {
                clonedObject.push(clone(item, deep));
            }
            else {
                clonedObject.push(item);
            }
        });
    }
    else {
        clonedObject = {};
        for (var x in object) {
            if (typeof object[x] === "object" && object[x] !== null && deep) {
                clonedObject[x] = clone(object[x], deep);
            }
            else {
                clonedObject[x] = object[x];
            }
        }
    }
    return clonedObject;
};
//# sourceMappingURL=clone.js.map