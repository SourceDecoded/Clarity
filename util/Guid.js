"use strict";
class Guid {
    static S4() {
        return Math.floor(Math.random() * 0x10000 /* 65536 */).toString(16);
    }
    static create() {
        return (Guid.S4() + Guid.S4() + "-" +
            Guid.S4() + "-" +
            Guid.S4() + "-" +
            Guid.S4() + "-" +
            Guid.S4() + Guid.S4() + Guid.S4());
    }
}
module.exports = Guid;
//# sourceMappingURL=Guid.js.map