"use strict";
var toPascalCase = require("../string/toPascalCase");
var toPascalCasedProperties = function (obj) {
    if (typeof obj !== "object" || obj === null) {
        return obj;
    }
    var newObj = Array.isArray(obj) ? [] : {};
    return Object.keys(obj).reduce(function (newObj, key) {
        var pascalCaseKey = toPascalCase(key);
        if (obj[key] instanceof Date) {
            newObj[pascalCaseKey] = new Date(obj[key]);
        }
        else if (typeof obj[key] === "object" && obj[key] !== null) {
            newObj[pascalCaseKey] = toPascalCasedProperties(obj[key]);
        }
        else {
            newObj[pascalCaseKey] = obj[key];
        }
        return newObj;
    }, newObj);
};
module.exports = toPascalCasedProperties;
//# sourceMappingURL=toPascalCasedProperties.js.map