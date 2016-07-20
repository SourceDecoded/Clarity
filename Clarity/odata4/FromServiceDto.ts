import EdmPackage = require("../data/Edm");
import MultiKeyMap = require("../collections/MultiKeyMap");
import fromServiceHandlerCollection = require("./fromServiceHandlerCollection");
import toEnum = require("../string/toEnum");
import toEnumFlag = require("../string/toEnumFlag");

var primitiveHandlers = fromServiceHandlerCollection;

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

class FromServiceDto {
    private edm: EdmPackage.Edm;
    private handlers: MultiKeyMap;

    getHandlers(entity) {
        var Type = entity.constructor;
        var model = this.edm.getModelByType(Type);
        var properties = model.properties;

        Object.keys(properties).forEach((key) => {
            var property = properties[key];

            if (property.type === EdmPackage.Enum) {
                this.handlers.add(Type, key, (value) => {
                    return enumHandler(property, value);
                });
                return;
            } else if (property.type === EdmPackage.EnumFlag) {
                this.handlers.add(Type, key, (value) => {
                    return enumFlagHandler(property, value);
                });
                return;
            }

            this.handlers.add(Type, key, primitiveHandlers.get(property.type) || defaultHandler);
        });

        this.edm.getOneToOneRelationships(entity).forEach((relationship) => {
            this.handlers.add(Type, relationship.hasOne, (dto) => {
                var model = this.edm.getModelByType(relationship.ofType);
                return this.resolve(model, dto);
            });
        });

        this.edm.getOneToOneAsTargetRelationships(entity).forEach((relationship) => {
            this.handlers.add(Type, relationship.withOne, (dto) => {
                var model = this.edm.getModelByType(relationship.type);
                return this.resolve(model, dto);
            });
        });

        this.edm.getOneToManyRelationships(entity).forEach((relationship) => {
            this.handlers.add(Type, relationship.hasMany, (array) => {
                return array.map((dto) => {
                    var model = this.edm.getModelByType(relationship.ofType);
                    return this.resolve(model, dto);
                });
            });
        });

        this.edm.getOneToManyAsTargetRelationships(entity).forEach((relationship) => {
            this.handlers.add(Type, relationship.withOne, (dto) => {
                var model = this.edm.getModelByType(relationship.type);
                return this.resolve(model, dto);
            });
        });

        this.edm.getManyToManyRelationships(entity).forEach((relationship) => {
            this.handlers.add(Type, relationship.hasMany, (array) => {
                return array.map((dto) => {
                    var model = this.edm.getModelByType(relationship.ofType);
                    return this.resolve(model, dto);
                });
            });
        });

        this.edm.getManyToManyAsTargetRelationships(entity).forEach((relationship) => {
            this.handlers.add(Type, relationship.withMany, (array) => {
                return array.map((dto) => {
                    var model = this.edm.getModelByType(relationship.type);
                    return this.resolve(model, dto);
                });
            });
        });

        return this.handlers;
    }


    constructor(edm: EdmPackage.Edm) {
        this.edm = edm;
        this.handlers = new MultiKeyMap();

        edm.getModels().getValues().forEach((model) => {
            var entity = new model.type();
            this.getHandlers(entity);
        });
    }

    resolve(model, dto) {
        var entity = new model.type();

        this.handlers.get(model.type).getKeys().forEach((key) => {
            var handler = this.handlers.get(model.type, key);

            if (typeof handler === "function" && dto[key] != null) {
                entity[key] = handler(dto[key]);
            }
        });

        return entity;
    };
}

export = FromServiceDto;