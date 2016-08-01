"use strict";
var toEnumFlag = function (string, Type) {
    var keys = string.split(",");
    var intList = keys.filter(function (string) {
        return Type[string.trim()] == null ? false : true;
    }).map(function (string) {
        return Type[string.trim()];
    });
    if (intList.length === 0) {
        return 0;
    }
    return intList.reduce(function (last, next) {
        return last | next;
    });
};
String.prototype.toEnumFlag = function (Type) {
    return toEnumFlag(this, Type);
};
module.exports = toEnumFlag;
//# sourceMappingURL=toEnumFlag.js.map