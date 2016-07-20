import toCamelCase = require("../string/toCamelCase");

var toCamelCasedProperties = (obj) => {
    if (typeof obj !== "object" || obj === null) {
        return obj;
    }

    var newObj = Array.isArray(obj) ? [] : {};
    return Object.keys(obj).reduce((newObj, key) => {
        var camelCaseKey = toCamelCase(key);

        if (typeof obj[key] === "object" && obj[key] !== null) {
            newObj[camelCaseKey] = toCamelCasedProperties(obj[key]);
        } else {
            newObj[camelCaseKey] = obj[key];
        }

        return newObj;
    }, newObj);
}

export = toCamelCasedProperties;


