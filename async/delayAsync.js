"use strict";
const Future = require("./Future");
module.exports = function (delayInMilliseconds) {
    if (typeof delayInMilliseconds !== "number") {
        throw new Error("Expected a number.");
    }
    return new Future(function (setValue, setError, cancel, ifCanceled) {
        var timeout = setTimeout(setValue, delayInMilliseconds);
        ifCanceled(function () {
            clearTimeout(timeout);
        });
    });
};
//# sourceMappingURL=delayAsync.js.map