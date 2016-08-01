define(["require", "exports"], function (require, exports) {
    var _this = this;
    exports.isPrimitive = function (value) {
        if (typeof value === "number" ||
            typeof value === "string" ||
            typeof value === "boolean" ||
            value instanceof Date ||
            value instanceof Number ||
            value === null) {
            return true;
        }
        return false;
    };
    exports.flattenEntity = function (obj, keepComplexObjects) {
        var clone = new obj.constructor();
        var self = _this;
        Object.keys(obj).forEach(function (key) {
            var value = obj[key];
            if (exports.isPrimitive(value)) {
                if (key !== "_hash") {
                    clone[key] = obj[key];
                }
            }
            else {
                if (!keepComplexObjects) {
                    clone[key] = undefined;
                }
            }
        });
        return clone;
    };
    exports.shallowCloneEntity = function (entity) {
        var Type = entity.constructor;
        var clone = new Type();
        for (var x in clone) {
            if (exports.isPrimitive(entity[x])) {
                clone[x] = entity[x];
            }
        }
        return clone;
    };
    exports.convertDtoToJavascriptEntity = function (Type, dto) {
        var entity = new Type();
        for (var x in dto) {
            var objX = x;
            if (x.substr(0, 2) !== x.substr(0, 2).toUpperCase()) {
                objX = x.substr(0, 1).toLowerCase() + x.substring(1);
            }
            if (exports.isPrimitive(dto[x])) {
                entity[objX] = dto[x];
            }
        }
        return entity;
    };
    exports.makePrimaryKeyString = function (entity, primaryKeys) {
        var keys = {};
        primaryKeys.forEach(function (primaryKey) {
            keys[primaryKey] = entity[primaryKey];
        });
        return JSON.stringify(keys);
    };
});
