"use strict";
var Hashmap = require("../collections/Hashmap");
Array.prototype.union = function (array) {
    var hashmap = new Hashmap();
    var add = function (value) {
        hashmap.add(value, value);
    };
    this.forEach(add);
    array.forEach(add);
    return hashmap.getValues();
};
//# sourceMappingURL=union.js.map