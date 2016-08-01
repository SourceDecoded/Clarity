define(["require", "exports"], function (require, exports) {
    return function (obj, methodName, args) {
        var value;
        if (!(obj instanceof Object)) {
            throw new Error("A obj must be supplied");
        }
        if (typeof obj[methodName] === "function") {
            value = obj[methodName].apply(obj, args);
        }
        return value;
    };
});
