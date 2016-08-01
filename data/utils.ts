export var isPrimitive = (value) => {

    if (typeof value === "number" ||
        typeof value === "string" ||
        typeof value === "boolean" ||
        value instanceof Date ||
        value instanceof Number ||
        value === null) {

        return true;

    }

    return false;
}

export var flattenEntity = (obj, keepComplexObjects?) => {
    var clone = new obj.constructor();
    var self = this;

    Object.keys(obj).forEach(function (key) {
        var value = obj[key];

        if (isPrimitive(value)) {
            if (key !== "_hash") {
                clone[key] = obj[key];
            }
        } else {
            if (!keepComplexObjects) {
                clone[key] = undefined;
            }
        }
    });

    return clone;
};

export var shallowCloneEntity = (entity) => {
    var Type = entity.constructor;
    var clone = new Type();

    for (var x in clone) {
        if (isPrimitive(entity[x])) {
            clone[x] = entity[x];
        }
    }

    return clone;
};

export var convertDtoToJavascriptEntity = (Type, dto) => {
    var entity = new Type();

    for (var x in dto) {
        var objX = x;

        if (x.substr(0, 2) !== x.substr(0, 2).toUpperCase()) {
            objX = x.substr(0, 1).toLowerCase() + x.substring(1);
        }

        if (isPrimitive(dto[x])) {
            entity[objX] = dto[x];
        }
    }

    return entity;
};

export var makePrimaryKeyString = (entity, primaryKeys) => {
    var keys = {};
    primaryKeys.forEach(function (primaryKey) {
        keys[primaryKey] = entity[primaryKey];
    });

    return JSON.stringify(keys);
};
