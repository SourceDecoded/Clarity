export = function (namespace, context?) {
    context = typeof context === "undefined" ? global : context;

    if (namespace === "") {
        return context;
    }

    if (typeof namespace === "string") {
        var a = namespace.split(".");
        var length = a.length;
        var obj;

        obj = context[a[0]];

        if (typeof obj === "undefined") {
            return undefined;
        }

        for (var x = 1; x < length; x++) {
            if (typeof obj[a[x]] === "undefined") {
                return undefined;
            } else {
                obj = obj[a[x]];
            }
        }

        return obj;
    } else {
        return undefined;
    }
}