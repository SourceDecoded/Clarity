"use strict";
var Hashmap = require("../collections/Hashmap");
var toServiceHandlerCollection = require("./toServiceHandlerCollection");
var EdmPackage = require("../data/Edm");
require("../number/toEnumString");
require("../number/toEnumFlagString");
require("../array/firstOrDefault");
var defaultHandler = function (value) {
    return value;
};
var enumHandler = function (property, value) {
    if (typeof value === "number") {
        return value.toEnumString(property.genericTypeParameters[0]);
    }
    return "None";
};
var enumFlagHandler = function (property, value) {
    if (typeof value === "number") {
        return value.toEnumFlagString(property.genericTypeParameters[0]);
    }
    return "None";
};
var ToServiceDto = (function () {
    function ToServiceDto(edm) {
        this.models = new Hashmap();
        this.primitiveTypes = edm.getPrimitiveTypes();
        this.edm = edm;
    }
    ToServiceDto.prototype.getModel = function (Type) {
        var model = this.models.get(Type);
        if (model === null) {
            model = this.edm.getModelByType(Type);
            this.models.add(Type, model);
        }
        return model;
    };
    ;
    ToServiceDto.prototype.getHandler = function (EntityType, propertyName) {
        var model = this.getModel(EntityType);
        var properties = model.properties;
        var results = Object.keys(properties).filter(function (key) {
            return key === propertyName;
        }).map(function (key) {
            var property = properties[key];
            if (property.type === EdmPackage.Enum) {
                return function (value) {
                    return enumHandler(property, value);
                };
            }
            else if (property.type === EdmPackage.EnumFlag) {
                return function (value) {
                    return enumFlagHandler(property, value);
                };
            }
            return toServiceHandlerCollection.get(property.type) || defaultHandler;
        });
        return results.firstOrDefault();
    };
    ;
    ToServiceDto.prototype.getHandlers = function (entity, model) {
        var _this = this;
        return Object.keys(model.properties).filter(function (key) {
            var property = model.properties[key];
            return !property.autoIncrement && _this.primitiveTypes.hasKey(property.type);
        }).reduce(function (handlers, key) {
            handlers[key] = _this.getHandler(entity.constructor, key);
            return handlers;
        }, {});
    };
    ;
    ToServiceDto.prototype.resolve = function (entity) {
        var Type = entity.constructor;
        var model = this.getModel(Type);
        var dto = {};
        var handlers = this.getHandlers(entity, model);
        Object.keys(handlers).forEach(function (key) {
            dto[key] = handlers[key](entity[key]);
        });
        return dto;
    };
    ;
    ToServiceDto.prototype.resolveUpdate = function (entity, updates) {
        var Type = entity.constructor;
        var model = this.getModel(Type);
        var dto = {};
        var handlers = this.getHandlers(entity, model);
        Object.keys(updates).forEach(function (key) {
            if (typeof handlers[key] === "function") {
                dto[key] = handlers[key](updates[key]);
            }
            else {
                dto[key] = updates[key];
            }
        });
        return dto;
    };
    return ToServiceDto;
}());
;
module.exports = ToServiceDto;
//# sourceMappingURL=ToServiceDto.js.map