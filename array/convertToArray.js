"use strict";
module.exports = (arrayLike) => {
    var array = [];
    for (var x = 0; x < arrayLike.length; x++) {
        array.push(arrayLike[x]);
    }
    return array;
};
//# sourceMappingURL=convertToArray.js.map