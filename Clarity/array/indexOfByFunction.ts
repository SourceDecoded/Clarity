var indexOfByFunction = function (array, filter) {
    var match;
    var index = -1;
    var length = array.length;

    for (var x = 0; x < length; x++) {
        match = filter(array[x], x);
        if (match) {
            index = x;
            break;
        }
    }

    return index;
};

(<any>Array.prototype).indexOfByFunction = function (filter) {
    return indexOfByFunction(this, filter);
};

export = indexOfByFunction;

