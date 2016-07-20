"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var clone = require("../util/clone");
var Hashmap = require("../collections/Hashmap");
require("../array/union");
var Double = (function (_super) {
    __extends(Double, _super);
    function Double() {
        _super.apply(this, arguments);
    }
    return Double;
}(Number));
exports.Double = Double;
var Float = (function (_super) {
    __extends(Float, _super);
    function Float() {
        _super.apply(this, arguments);
    }
    return Float;
}(Number));
exports.Float = Float;
var Integer = (function (_super) {
    __extends(Integer, _super);
    function Integer() {
        _super.apply(this, arguments);
    }
    return Integer;
}(Number));
exports.Integer = Integer;
var Binary = (function (_super) {
    __extends(Binary, _super);
    function Binary() {
        _super.apply(this, arguments);
    }
    return Binary;
}(Number));
exports.Binary = Binary;
var Decimal = (function (_super) {
    __extends(Decimal, _super);
    function Decimal() {
        _super.apply(this, arguments);
    }
    return Decimal;
}(Number));
exports.Decimal = Decimal;
var Byte = (function (_super) {
    __extends(Byte, _super);
    function Byte() {
        _super.apply(this, arguments);
    }
    return Byte;
}(Number));
exports.Byte = Byte;
var Enum = (function (_super) {
    __extends(Enum, _super);
    function Enum(value) {
        _super.call(this, value);
        this.value = value;
    }
    Enum.prototype.valueOf = function () {
        return this.value;
    };
    return Enum;
}(Number));
exports.Enum = Enum;
var EnumFlag = (function (_super) {
    __extends(EnumFlag, _super);
    function EnumFlag() {
        _super.apply(this, arguments);
    }
    return EnumFlag;
}(Enum));
exports.EnumFlag = EnumFlag;
var DateTimeOffset = (function (_super) {
    __extends(DateTimeOffset, _super);
    function DateTimeOffset() {
        _super.apply(this, arguments);
    }
    return DateTimeOffset;
}(Date));
exports.DateTimeOffset = DateTimeOffset;
var Location = (function () {
    function Location() {
    }
    return Location;
}());
exports.Location = Location;
var assertHasEnumPropertiesIfEnum = function (property) {
    if (property.type === Enum &&
        (!Array.isArray(property.genericTypeParameters) ||
            property.genericTypeParameters == null)) {
        throw new Error("An Enum type needs to have the genericTypeParameters specified.");
    }
};
var makeArray = function () { return []; };
var primitives = new Hashmap();
primitives.add(String, String);
primitives.add(Number, Number);
primitives.add(Boolean, Boolean);
primitives.add(Date, Date);
primitives.add(DateTimeOffset, DateTimeOffset);
primitives.add(Double, Double);
primitives.add(Float, Float);
primitives.add(Integer, Integer);
primitives.add(Decimal, Decimal);
primitives.add(Binary, Binary);
primitives.add(Byte, Byte);
primitives.add(Location, Location);
primitives.add(EnumFlag, EnumFlag);
primitives.add(Enum, Enum);
var Edm = (function () {
    function Edm() {
        this.oneToOneRelationships = [];
        this.oneToManyRelationships = [];
        this.manyToManyRelationships = [];
        this.mappingTypes = new Hashmap();
        this.collectionToModels = new Hashmap();
        this.typeToModels = new Hashmap();
        this.originalModels = [];
        this.hiddenTableCount = 0;
        this.name = "Unknown";
    }
    Edm.prototype.createDefaultProperties = function (Type) {
        var entity = new Type();
        var properties = {};
        Object.keys(entity).forEach(function (key) {
            properties[key] = {
                type: undefined
            };
        });
        return properties;
    };
    ;
    Edm.prototype.findAllBaseTypeModels = function (Type) {
        var matchedModels = [];
        var instance = new Type();
        var models = this.collectionToModels.getValues();
        models.forEach(function (model) {
            if (instance instanceof model.type) {
                matchedModels.push(model);
            }
        });
        return matchedModels;
    };
    ;
    Edm.prototype.getManyToManyAsMappingRelationships = function (mappingEntity) {
        return this.manyToManyRelationships.filter(function (relationship) {
            if (mappingEntity instanceof relationship.usingMappingType) {
                return true;
            }
            return false;
        });
    };
    ;
    Edm.prototype.getSourceAndTargetsModel = function (relationship) {
        var sourceModel = this.typeToModels.get(relationship.type);
        var targetModel = this.typeToModels.get(relationship.ofType);
        if (!sourceModel) {
            throw new Error("Couldn't find model for source.");
        }
        if (!targetModel) {
            throw new Error("Couldn't find model for target.");
        }
        return {
            source: sourceModel,
            target: targetModel
        };
    };
    ;
    Edm.prototype.addRelationalProperties = function (relationship) {
        var models = this.getSourceAndTargetsModel(relationship);
        this.addPrimaryKeyRelationship(models.source, relationship);
        this.addForeignKeyRelationship(models.target, relationship);
    };
    ;
    Edm.prototype.addPrimaryKeyRelationship = function (model, relationship) {
        model.properties[relationship.hasKey].primaryKeyRelationships.push(relationship);
    };
    ;
    Edm.prototype.addForeignKeyRelationship = function (model, relationship) {
        model.properties[relationship.withKey].foreignKeyRelationship = relationship;
        model.properties[relationship.withKey].primaryKeyRelationships.push(relationship);
    };
    ;
    Edm.prototype.removePrimaryKeyRelationship = function (model, relationship) {
        var models = this.getSourceAndTargetsModel(relationship);
        var primaryKeyRelationships = models.source.properties[relationship.hasKey].primaryKeyRelationships;
        var index = primaryKeyRelationships.indexOf(relationship);
        if (index >= 0) {
            primaryKeyRelationships.splice(index, 1);
        }
    };
    ;
    Edm.prototype.removeForeignKeyRelationship = function (model, relationship) {
        model.properties[relationship.withKey].foreignKeyRelationship = null;
    };
    ;
    Edm.prototype.removeRelationalProperties = function (relationship) {
        var models = this.getSourceAndTargetsModel(relationship);
        this.removePrimaryKeyRelationship(models.source, relationship);
        this.removeForeignKeyRelationship(models.target, relationship);
    };
    ;
    Edm.prototype._getPrimaryKeyProperties = function (model) {
        return Object.keys(model.properties).filter(function (key) {
            var property = model.properties[key];
            // primaryKey may be truthy or falsy, so we turn it into a bool.
            return property.primaryKey === true;
        });
    };
    ;
    Edm.prototype.getOneToOneRelationships = function (entity) {
        return this.oneToOneRelationships.filter(function (relationship) {
            if (entity instanceof relationship.type) {
                return true;
            }
            return false;
        });
    };
    ;
    Edm.prototype.getOneToOneAsTargetRelationships = function (entity) {
        return this.oneToOneRelationships.filter(function (relationship) {
            if (entity instanceof relationship.ofType) {
                return true;
            }
            return false;
        });
    };
    ;
    Edm.prototype.getOneToManyRelationships = function (entity) {
        return this.oneToManyRelationships.filter(function (relationship) {
            if (entity instanceof relationship.type) {
                return true;
            }
            return false;
        });
    };
    ;
    Edm.prototype.getOneToManyAsTargetRelationships = function (entity) {
        return this.oneToManyRelationships.filter(function (relationship) {
            if (entity instanceof relationship.ofType) {
                return true;
            }
            return false;
        });
    };
    ;
    Edm.prototype.getManyToManyRelationships = function (entity) {
        return this.manyToManyRelationships.filter(function (relationship) {
            if (entity instanceof relationship.type) {
                return true;
            }
            return false;
        });
    };
    ;
    Edm.prototype.getManyToManyAsTargetRelationships = function (entity) {
        return this.manyToManyRelationships.filter(function (relationship) {
            if (entity instanceof relationship.ofType) {
                return true;
            }
            return false;
        });
    };
    ;
    Edm.prototype.getAllKeyProperties = function (Type) {
        var properties = [];
        var entity = new Type();
        this.getOneToOneRelationships(entity).forEach(function (relationship) {
            properties.push(relationship.hasKey);
        });
        this.getOneToOneAsTargetRelationships(entity).forEach(function (relationship) {
            properties.push(relationship.withForeignKey);
        });
        this.getOneToManyRelationships(entity).forEach(function (relationship) {
            properties.push(relationship.hasKey);
        });
        this.getOneToManyAsTargetRelationships(entity).forEach(function (relationship) {
            properties.push(relationship.withForeignKey);
        });
        return properties;
    };
    ;
    Edm.prototype.addOneToOne = function (relationship) {
        this.oneToOneRelationships.push(relationship);
        var models = this.getSourceAndTargetsModel(relationship);
        var source = models.source;
        var target = models.target;
        source.properties[relationship.hasOne] = {
            type: Object
        };
        target.properties[relationship.withOne] = {
            type: Object
        };
        this.addRelationalProperties(relationship);
    };
    ;
    Edm.prototype.removeOneToOne = function (relationship) {
        this.removeRelationalProperties(relationship);
        var index = this.oneToOneRelationships.indexOf(relationship);
        if (index >= 0) {
            this.oneToOneRelationships.splice(index, 1);
        }
    };
    ;
    Edm.prototype.addOneToMany = function (relationship) {
        this.oneToManyRelationships.push(relationship);
        var models = this.getSourceAndTargetsModel(relationship);
        var source = models.source;
        var target = models.target;
        source.properties[relationship.hasMany] = {
            type: Array
        };
        target.properties[relationship.withOne] = {
            type: Object
        };
        this.addRelationalProperties(relationship);
    };
    ;
    Edm.prototype.removeOneToMany = function (relationship) {
        this.removeRelationalProperties(relationship);
        var index = this.oneToManyRelationships.indexOf(relationship);
        if (index >= 0) {
            this.oneToManyRelationships.splice(index, 1);
        }
    };
    ;
    Edm.prototype.addManyToMany = function (relationship) {
        var mappingType = relationship.usingMappingType;
        if (!mappingType) {
            throw new Error("Many to many relationship needs to supply the mapping Type.");
        }
        else {
            this.mappingTypes.add(mappingType, mappingType);
            this.manyToManyRelationships.push(relationship);
        }
        var models = this.getSourceAndTargetsModel(relationship);
        var mappingModel = this.typeToModels.get(relationship.usingMappingType);
        var source = models.source;
        var target = models.target;
        source.properties[relationship.hasMany] = {
            type: Array
        };
        target.properties[relationship.withMany] = {
            type: Array
        };
        models.source.properties[relationship.hasKey].primaryKeyRelationships.push(relationship);
        models.target.properties[relationship.withKey].primaryKeyRelationships.push(relationship);
        var sourceRelationship = {
            type: relationship.type,
            hasKey: relationship.hasKey,
            ofType: relationship.usingMappingType,
            withForeignKey: relationship.hasForeignKey
        };
        var targetRelationship = {
            type: relationship.ofType,
            hasKey: relationship.withKey,
            ofType: relationship.usingMappingType,
            withForeignKey: relationship.withForeignKey
        };
        mappingModel.properties[relationship.hasForeignKey].foreignKeyRelationship = sourceRelationship;
        mappingModel.properties[relationship.withForeignKey].foreignKeyRelationship = targetRelationship;
    };
    ;
    Edm.prototype.removeManyToMany = function (relationship) {
        var models = this.getSourceAndTargetsModel(relationship);
        var mappingModel = this.typeToModels.get(relationship.usingMappingType);
        var sourcePrimaryKeyRelationships = models.source.properties[relationship.hasKey].primaryKeyRelationships;
        var targetPrimaryKeyRelationships = models.target.properties[relationship.withKey].primaryKeyRelationships;
        var sourceIndex = sourcePrimaryKeyRelationships.indexOf(relationship);
        if (sourceIndex >= 0) {
            sourcePrimaryKeyRelationships.splice(sourceIndex, 1);
        }
        var targetIndex = targetPrimaryKeyRelationships.indexOf(relationship);
        if (targetIndex >= 0) {
            targetPrimaryKeyRelationships.splice(targetIndex, 1);
        }
        mappingModel.properties[relationship.hasForeignKey].foreignKeyRelationship = null;
        mappingModel.properties[relationship.withForeignKey].foreignKeyRelationship = null;
        var index = this.manyToManyRelationships.indexOf(relationship);
        if (index >= 0) {
            this.manyToManyRelationships.splice(index, 1);
            var mappingType = relationship.usingMappingType;
            this.mappingTypes.remove(mappingType);
        }
    };
    ;
    Edm.prototype.getMappingTypes = function () {
        return this.mappingTypes.copy();
    };
    ;
    Edm.prototype.getAllModels = function (Type) {
        var _this = this;
        var models = [];
        var instance = new Type();
        this.typeToModels.getKeys().forEach(function (T) {
            if (instance instanceof T) {
                models.push(_this.typeToModels.get(T));
            }
        });
        return models;
    };
    ;
    Edm.prototype.getPrimaryKeyProperties = function (Type) {
        var model = this.getModelByType(Type);
        return this._getPrimaryKeyProperties(model);
    };
    ;
    Edm.prototype.addModel = function (config) {
        config = config || {};
        var collectionName = config.collectionName;
        var Type = config.type;
        var BaseType = config.baseType;
        var properties = config.properties = config.properties || {};
        var baseModel = null;
        var baseProperties = {};
        if (!collectionName) {
            config.collectionName = collectionName = "hidden_table_" + this.hiddenTableCount;
            this.hiddenTableCount++;
        }
        if (collectionName.match(/\s/) !== null) {
            throw new Error("The collectionName cannot have spaces.");
        }
        if (typeof Type !== "function") {
            throw new Error("Expected a constructor in the configurations object.");
        }
        this.originalModels.push(clone(config, true));
        if (BaseType != null) {
            var baseModels = this.findAllBaseTypeModels(BaseType);
            baseModels.forEach(function (baseModel) {
                Object.keys(baseModel.properties).forEach(function (key) {
                    baseProperties[key] = baseModel.properties[key];
                });
            });
        }
        var defaultProperties = this.createDefaultProperties(Type);
        var keys = Object.keys(properties).union(Object.keys(defaultProperties)).union(Object.keys(baseProperties));
        keys.forEach(function (key) {
            if (baseProperties[key] && !properties[key]) {
                properties[key] = clone(baseProperties[key]);
            }
            if (!properties[key]) {
                properties[key] = defaultProperties[key];
            }
            assertHasEnumPropertiesIfEnum(properties[key]);
            properties[key].primaryKeyRelationships = [];
            properties[key].foreignKeyRelationship = null;
        });
        this.collectionToModels.add(collectionName, config);
        this.typeToModels.add(Type, config);
    };
    ;
    Edm.prototype.removeModel = function (collectionName) {
        var model = this.collectionToModels.remove(collectionName);
        this.typeToModels.remove(model.type);
    };
    ;
    Edm.prototype.getModel = function (collectionName) {
        return this.collectionToModels.get(collectionName);
    };
    ;
    Edm.prototype.getModels = function () {
        return this.collectionToModels.copy();
    };
    ;
    Edm.prototype.getModelByType = function (Type) {
        return this.typeToModels.get(Type);
    };
    ;
    Edm.prototype.getPrimitiveTypes = function () {
        return primitives.copy();
    };
    ;
    Edm.prototype.clone = function () {
        var edm = new Edm();
        var models = clone(this.originalModels, true);
        models.forEach(function (model) {
            edm.addModel(model);
        });
        this.oneToOneRelationships.forEach(function (relationship) {
            edm.addOneToOne(clone(relationship, true));
        });
        this.oneToManyRelationships.forEach(function (relationship) {
            edm.addOneToMany(clone(relationship, true));
        });
        this.manyToManyRelationships.forEach(function (relationship) {
            edm.addManyToMany(clone(relationship, true));
        });
        return edm;
    };
    ;
    return Edm;
}());
exports.Edm = Edm;
//# sourceMappingURL=Edm.js.map