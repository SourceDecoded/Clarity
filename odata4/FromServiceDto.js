"use strict";
var EdmPackage = require("../data/Edm");
var MultiKeyMap = require("../collections/MultiKeyMap");
var fromServiceHandlerCollection = require("./fromServiceHandlerCollection");
var toEnum = require("../string/toEnum");
var toEnumFlag = require("../string/toEnumFlag");
var util = require("./util");
require("../number/toEnumString");
require("../number/toEnumFlagString");
var primitiveHandlers = fromServiceHandlerCollection;
var replaceHashRegEx = /^\#/;
var defaultHandler = function (value) {
    if (value == null) {
        return null;
    }
    return value;
};
var enumHandler = function (property, value) {
    if (typeof value === "string") {
        return toEnum(value, property.genericTypeParameters[0]);
    }
    return 0;
};
var enumFlagHandler = function (property, value) {
    if (typeof value === "string") {
        return toEnumFlag(value, property.genericTypeParameters[0]);
    }
    return 0;
};
var FromServiceDto = (function () {
    function FromServiceDto(edm) {
        var _this = this;
        this.edm = edm;
        this.handlers = new MultiKeyMap();
        this.namespaceToType = util.createNamespaceToTypeHashmap(edm);
        edm.getModels().getValues().forEach(function (model) {
            var entity = new model.type();
            _this.getHandlers(entity);
        });
    }
    FromServiceDto.prototype.getHandlers = function (entity) {
        var _this = this;
        var Type = entity.constructor;
        var model = this.edm.getModelByType(Type);
        var properties = model.properties;
        Object.keys(properties).forEach(function (key) {
            var property = properties[key];
            if (property.type === EdmPackage.Enum) {
                _this.handlers.add(Type, key, function (value) {
                    return enumHandler(property, value);
                });
                return;
            }
            else if (property.type === EdmPackage.EnumFlag) {
                _this.handlers.add(Type, key, function (value) {
                    return enumFlagHandler(property, value);
                });
                return;
            }
            _this.handlers.add(Type, key, primitiveHandlers.get(property.type) || defaultHandler);
        });
        this.edm.getOneToOneRelationships(entity).forEach(function (relationship) {
            _this.handlers.add(Type, relationship.hasOne, function (dto) {
                var model = _this.edm.getModelByType(relationship.ofType);
                return _this.resolve(model, dto);
            });
        });
        this.edm.getOneToOneAsTargetRelationships(entity).forEach(function (relationship) {
            _this.handlers.add(Type, relationship.withOne, function (dto) {
                var model = _this.edm.getModelByType(relationship.type);
                return _this.resolve(model, dto);
            });
        });
        this.edm.getOneToManyRelationships(entity).forEach(function (relationship) {
            _this.handlers.add(Type, relationship.hasMany, function (array) {
                return array.map(function (dto) {
                    var model = _this.edm.getModelByType(relationship.ofType);
                    return _this.resolve(model, dto);
                });
            });
        });
        this.edm.getOneToManyAsTargetRelationships(entity).forEach(function (relationship) {
            _this.handlers.add(Type, relationship.withOne, function (dto) {
                var model = _this.edm.getModelByType(relationship.type);
                return _this.resolve(model, dto);
            });
        });
        this.edm.getManyToManyRelationships(entity).forEach(function (relationship) {
            _this.handlers.add(Type, relationship.hasMany, function (array) {
                return array.map(function (dto) {
                    var model = _this.edm.getModelByType(relationship.ofType);
                    return _this.resolve(model, dto);
                });
            });
        });
        this.edm.getManyToManyAsTargetRelationships(entity).forEach(function (relationship) {
            _this.handlers.add(Type, relationship.withMany, function (array) {
                return array.map(function (dto) {
                    var model = _this.edm.getModelByType(relationship.type);
                    return _this.resolve(model, dto);
                });
            });
        });
        return this.handlers;
    };
    FromServiceDto.prototype.resolve = function (model, dto) {
        var odataType = dto["@odata.type"];
        var Type;
        if (odataType) {
            Type = this.namespaceToType.get(odataType.replace(replaceHashRegEx, "")) || model.type;
        }
        else {
            Type = model.type;
        }
        var entity = new Type();
        var handlers = this.handlers;
        handlers.get(Type).getKeys().forEach(function (key) {
            var handler = handlers.get(Type, key);
            if (typeof handler === "function" && dto[key] != null) {
                entity[key] = handler(dto[key]);
            }
        });
        return entity;
    };
    ;
    return FromServiceDto;
}());
module.exports = FromServiceDto;
//# sourceMappingURL=FromServiceDto.js.map