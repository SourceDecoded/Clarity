import clone = require("../util/clone");
import Hashmap = require("../collections/Hashmap");
require("../array/union");

export class Double extends Number { }
export class Float extends Number { }
export class Integer extends Number { }
export class Binary extends Number { }
export class Decimal extends Number { }
export class Byte extends Number { }
export class Enum extends Number {
    value;
    constructor(value) {
        super(value);
        this.value = value;
    }
    valueOf() {
        return this.value;
    }
}
export class EnumFlag extends Enum { }
export class DateTimeOffset extends Date { }

export class Location {
    longitude: number;
    latitude: number;
}

var assertHasEnumPropertiesIfEnum = function (property) {
    if (property.type === Enum &&
        (!Array.isArray(property.genericTypeParameters) ||
            property.genericTypeParameters == null)
    ) {
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

export class Edm {
    oneToOneRelationships: any[];
    private oneToManyRelationships: any[];
    private manyToManyRelationships: any[];
    private mappingTypes: Hashmap;
    private collectionToModels: Hashmap;
    private typeToModels: Hashmap;
    private originalModels: any[];
    private hiddenTableCount: number;

    name: string;

    constructor() {
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

    private createDefaultProperties(Type) {

        var entity = new Type();
        var properties = {};

        Object.keys(entity).forEach(function (key) {
            properties[key] = {
                type: undefined
            };
        });

        return properties;

    };

    private findAllBaseTypeModels(Type) {
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

    private getManyToManyAsMappingRelationships(mappingEntity) {
        return this.manyToManyRelationships.filter(function (relationship) {
            if (mappingEntity instanceof relationship.usingMappingType) {
                return true;
            }
            return false;
        });
    };

    private getSourceAndTargetsModel(relationship) {
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

    private addRelationalProperties(relationship) {
        var models = this.getSourceAndTargetsModel(relationship);

        this.addPrimaryKeyRelationship(models.source, relationship);
        this.addForeignKeyRelationship(models.target, relationship);
    };

    private addPrimaryKeyRelationship(model, relationship) {
        model.properties[relationship.hasKey].primaryKeyRelationships.push(relationship);
    };

    private addForeignKeyRelationship(model, relationship) {
        model.properties[relationship.withKey].foreignKeyRelationship = relationship;
        model.properties[relationship.withKey].primaryKeyRelationships.push(relationship);
    };

    private removePrimaryKeyRelationship(model, relationship) {
        var models = this.getSourceAndTargetsModel(relationship);
        var primaryKeyRelationships = models.source.properties[relationship.hasKey].primaryKeyRelationships;
        var index = primaryKeyRelationships.indexOf(relationship);

        if (index >= 0) {
            primaryKeyRelationships.splice(index, 1);
        }
    };

    private removeForeignKeyRelationship(model, relationship) {
        model.properties[relationship.withKey].foreignKeyRelationship = null;
    };

    private removeRelationalProperties(relationship) {
        var models = this.getSourceAndTargetsModel(relationship);
        this.removePrimaryKeyRelationship(models.source, relationship);
        this.removeForeignKeyRelationship(models.target, relationship);
    };

    private _getPrimaryKeyProperties(model) {
        return Object.keys(model.properties).filter(function (key) {
            var property = model.properties[key];
            // primaryKey may be truthy or falsy, so we turn it into a bool.
            return property.primaryKey === true;
        });
    };


    getOneToOneRelationships(entity) {
        return this.oneToOneRelationships.filter(function (relationship) {
            if (entity instanceof relationship.type) {
                return true;
            }
            return false;
        });
    };

    getOneToOneAsTargetRelationships(entity) {
        return this.oneToOneRelationships.filter(function (relationship) {
            if (entity instanceof relationship.ofType) {
                return true;
            }
            return false;
        });
    };

    getOneToManyRelationships(entity) {
        return this.oneToManyRelationships.filter(function (relationship) {
            if (entity instanceof relationship.type) {
                return true;
            }
            return false;
        });
    };

    getOneToManyAsTargetRelationships(entity) {
        return this.oneToManyRelationships.filter(function (relationship) {
            if (entity instanceof relationship.ofType) {
                return true;
            }
            return false;
        });
    };

    getManyToManyRelationships(entity) {
        return this.manyToManyRelationships.filter(function (relationship) {
            if (entity instanceof relationship.type) {
                return true;
            }
            return false;
        });
    };

    getManyToManyAsTargetRelationships(entity) {
        return this.manyToManyRelationships.filter(function (relationship) {
            if (entity instanceof relationship.ofType) {
                return true;
            }
            return false;
        });
    };

    getAllKeyProperties(Type) {
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

    addOneToOne(relationship) {
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

    removeOneToOne(relationship) {
        this.removeRelationalProperties(relationship);

        var index = this.oneToOneRelationships.indexOf(relationship);
        if (index >= 0) {
            this.oneToOneRelationships.splice(index, 1);
        }
    };

    addOneToMany(relationship) {
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

    removeOneToMany(relationship) {
        this.removeRelationalProperties(relationship);

        var index = this.oneToManyRelationships.indexOf(relationship);
        if (index >= 0) {
            this.oneToManyRelationships.splice(index, 1);
        }
    };

    addManyToMany(relationship) {
        var mappingType = relationship.usingMappingType;
        if (!mappingType) {
            throw new Error("Many to many relationship needs to supply the mapping Type.");
        } else {
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

    removeManyToMany(relationship) {
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

    getMappingTypes() {
        return this.mappingTypes.copy();
    };

    getAllModels(Type) {
        var models = [];
        var instance = new Type();

        this.typeToModels.getKeys().forEach((T) => {
            if (instance instanceof T) {
                models.push(this.typeToModels.get(T));
            }
        });

        return models;
    };

    getPrimaryKeyProperties(Type) {
        var model = this.getModelByType(Type);
        return this._getPrimaryKeyProperties(model);
    };

    addModel(config) {
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
        var keys = (<any>(<any>Object.keys(properties)).union(Object.keys(defaultProperties)).union(Object.keys(baseProperties)));

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

    removeModel(collectionName) {
        var model = this.collectionToModels.remove(collectionName);
        this.typeToModels.remove(model.type);
    };

    getModel(collectionName) {
        return this.collectionToModels.get(collectionName);
    };

    getModels() {
        return this.collectionToModels.copy();
    };

    getModelByType(Type) {
        return this.typeToModels.get(Type);
    };

    getPrimitiveTypes() {
        return primitives.copy();
    };

    clone() {
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
}