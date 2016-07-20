var toEnum = function (string, Type) {
    var value = Type[string.trim()];

    if (value == null || (typeof value !== "number" && value.constructor !== Number)) {
        throw new Error("Coundn't resolve string to an Enum value.");
    }

    return value;
};

(<any>String.prototype).toEnum = function (Type) {
    return toEnum(this, Type);
};

export = toEnum;
