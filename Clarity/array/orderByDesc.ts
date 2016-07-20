var orderByDesc = function (array, expr) {
    return array.sort(function (a, b) {
        var aValue = expr(a);
        var bValue = expr(b);

        if (aValue instanceof Date) {
            aValue = aValue.getTime();
        }

        if (bValue instanceof Date) {
            bValue = bValue.getTime();
        }

        if (typeof aValue === "string") {
            aValue = aValue.toLowerCase();
        }

        if (typeof bValue === "string") {
            bValue = bValue.toLowerCase();
        }

        if (aValue === bValue) {
            return 0;
        } else if (aValue > bValue) {
            return -1;
        } else if (aValue < bValue) {
            return 1;
        }

    });
};

(<any>Array.prototype).orderByDesc = function (expr) {
    return orderByDesc(this, expr);
};

export = orderByDesc;