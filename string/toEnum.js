"use strict";
var toEnum = function (string, Type) {
    var value = parseFloat(Type[string.trim()].valueOf());
    if (isNaN(value)) {
        throw new Error("Coundn't resolve string to an Enum value.");
    }
    return value;
};
String.prototype.toEnum = function (Type) {
    return toEnum(this, Type);
};
module.exports = toEnum;
//# sourceMappingURL=toEnum.js.map