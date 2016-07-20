(<any>Array.prototype).intersect = function (array) {
    array = Array.isArray(array) ? array : [];
    return this.filter(function (n) {
        return array.indexOf(n) != -1;
    });
};

