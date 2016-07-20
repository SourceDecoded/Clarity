"use strict";
var Guid = (function () {
    function Guid() {
    }
    Guid.S4 = function () {
        return Math.floor(Math.random() * 0x10000 /* 65536 */).toString(16);
    };
    Guid.create = function () {
        return (Guid.S4() + Guid.S4() + "-" +
            Guid.S4() + "-" +
            Guid.S4() + "-" +
            Guid.S4() + "-" +
            Guid.S4() + Guid.S4() + Guid.S4());
    };
    return Guid;
}());
module.exports = Guid;
//# sourceMappingURL=Guid.js.map