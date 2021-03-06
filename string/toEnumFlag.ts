﻿var toEnumFlag = function (string, Type) {
    var keys = string.split(",");

    var intList = keys.filter((string) => {
        return Type[string.trim()] == null ? false : true;
    }).map((string) => {
        return Type[string.trim()];
    });

    if (intList.length === 0) {
        return 0;
    }

    return intList.reduce((last, next) => {
        return last | next;
    });
};

(<any>String.prototype).toEnumFlag = function (Type) {
    return toEnumFlag(this, Type);
};

export = toEnumFlag;
