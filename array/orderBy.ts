﻿(<any>Array.prototype).orderBy = function (expr) {
    return this.sort(function (a, b) {
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

        if (typeof aValue === "number" && isNaN(aValue) && typeof bValue === "number" && isNaN(bValue)) {
            return 0;
        }

        if (aValue === bValue) {
            return 0;
        } else if (aValue < bValue) {
            return -1;
        } else if (aValue > bValue) {
            return 1;
        }

    });
};

export = {};