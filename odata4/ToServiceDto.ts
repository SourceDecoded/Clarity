import Hashmap = require("../collections/Hashmap");
import toServiceHandlerCollection = require("./toServiceHandlerCollection");
import EdmPackage = require("../data/Edm");
import util = require("./util");

require("../number/toEnumString");
require("../number/toEnumFlagString");
require("../array/firstOrDefault");

var defaultHandler = function (value) {
    return value;
};

var enumHandler = function (property, value) {
    if (typeof value === "number") {
        return (<any>value).toEnumString(property.genericTypeParameters[0]);
    }
    return "None";
};

var enumFlagHandler = function (property, value) {
    if (typeof value === "number") {
        return (<any>value).toEnumFlagString(property.genericTypeParameters[0]);
    }
    return "None";
};

class ToServiceDto {
    private edm;
    private models;
    private primitiveTypes;
    private typeToNamespaceHashmap;

    constructor(edm) {
        this.models = new Hashmap();
        this.primitiveTypes = edm.getPrimitiveTypes();
        this.typeToNamespaceHashmap = util.createTypeToNamespaceHashmap(edm);
        this.edm = edm;
    }

    private getModel(Type) {
        var model = this.models.get(Type);
        if (model === null) {
            model = this.edm.getModelByType(Type);
            this.models.add(Type, model);
        }
        return model;
    };

    private getHandler(EntityType, propertyName) {
        var model = this.getModel(EntityType);
        var properties = model.properties;

        var results = Object.keys(properties).filter((key) => {
            return key === propertyName;
        }).map((key) => {
            var property = properties[key];

            if (property.type === EdmPackage.Enum) {
                return (value) => {
                    return enumHandler(property, value);
                }
            } else if (property.type === EdmPackage.EnumFlag) {
                return (value) => {
                    return enumFlagHandler(property, value);
                };
            }

            return toServiceHandlerCollection.get(property.type) || defaultHandler;
        });

        return (<any>results).firstOrDefault();
    };

    getHandlers(entity, model) {
        return Object.keys(model.properties).filter((key) => {
            var property = model.properties[key];
            return !property.autoIncrement && this.primitiveTypes.hasKey(property.type);
        }).reduce((handlers, key) => {
            handlers[key] = this.getHandler(entity.constructor, key);
            return handlers;
        }, {});
    };

    resolve(entity) {
        var Type = entity.constructor;
        var model = this.getModel(Type);
        var dto = {};

        var handlers = this.getHandlers(entity, model);

        Object.keys(handlers).forEach((key) => {
            dto[key] = handlers[key](entity[key]);
        });

        var namespace = this.typeToNamespaceHashmap.get(Type);
        if (namespace) {
            dto["@odata.type"] = namespace;
        }

        return dto;
    };

    resolveUpdate(entity, updates) {
        var Type = entity.constructor;
        var model = this.getModel(Type);
        var dto = {};

        var handlers = this.getHandlers(entity, model);

        Object.keys(updates).forEach((key) => {
            if (typeof handlers[key] === "function") {
                dto[key] = handlers[key](updates[key]);
            } else {
                dto[key] = updates[key];
            }
        });

        var namespace = this.typeToNamespaceHashmap.get(Type);
        if (namespace) {
            dto["@odata.type"] = namespace;
        }


        return dto;
    }
};

export = ToServiceDto;