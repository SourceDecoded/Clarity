import Hashmap = require("../collections/Hashmap");

(<any>Array.prototype).union = function (array: any[]) {
    var hashmap = new Hashmap();
    var add = function (value) {
        hashmap.add(value, value);
    };

    this.forEach(add);
    array.forEach(add);

    return hashmap.getValues();
};
