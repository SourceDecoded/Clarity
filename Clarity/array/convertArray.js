Object.defineProperty("convertToArray", {
    enumerable: false,
    configurable: true,
    value: function (arrayLike) {
        var array = [];
        for (var x = 0; x < arrayLike.length; x++) {
            array.push(arrayLike[x]);
        }
        return array;
    }
});
//# sourceMappingURL=convertArray.js.map