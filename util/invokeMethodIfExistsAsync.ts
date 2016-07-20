import Future = require("../async/Future");

export = function (obj, methodName, args): Future<any> {
    var value;
    if (!(obj instanceof Object)) {
        throw new Error("A object must be supplied");
    }
    if (typeof obj[methodName] === "function") {
        value = obj[methodName].apply(obj, args);
    }

    if (!(value instanceof Future)) {
        value = Future.fromResult(value);
    }

    return value;
}

 