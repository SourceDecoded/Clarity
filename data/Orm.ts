import EdmPackage = require("./Edm");
import MultiKeyMap = require("../collections/MultiKeyMap");
import Hashmap = require("../collections/Hashmap");
import PropertyBehavior = require("../util/PropertyBehavior");
import ObservableArray = require("../collections/ObservableArray");
import Observable = require("../util/Observable");

class Orm extends Observable {
    private edm: EdmPackage.Edm;
    private oneToOneObservers: MultiKeyMap;
    private oneToOneAsTargetObservers: MultiKeyMap;
    private oneToManyObservers: MultiKeyMap;
    private oneToManyAsTargetObservers: MultiKeyMap;
    private manyToManyObservers: MultiKeyMap;
    private manyToManyAsTargetObservers: MultiKeyMap;
    private mappingRelationships: Hashmap;
    private addedEntities: Hashmap;

    private createMappingEntity(Type, target, source, relationship) {

        var mappingEntity = new Type();
        var targetKey = relationship.withKey;
        var sourceKey = relationship.hasKey;

        mappingEntity[relationship.hasForeignKey] = target[targetKey];
        mappingEntity[relationship.withForeignKey] = source[sourceKey];
        mappingEntity.source = source;
        mappingEntity.target = target;
        mappingEntity.relationship = relationship;

        if (target[targetKey] === null) {
            var targetObserver = target.observeProperty(targetKey, (e) => {
                mappingEntity[relationship.hasForeignKey] = target[targetKey];
                targetObserver.dispose();
            });
        }

        if (source[sourceKey] === null) {
            var sourceObserver = source.observeProperty(sourceKey, (e) => {
                mappingEntity[relationship.withForeignKey] = source[sourceKey];
                sourceObserver.dispose();
            });
        }

        return mappingEntity;
    }

    private getMappingEntities(relationship) {
        var mappingEntities = this.mappingRelationships.get(relationship);
        if (mappingEntities === null) {
            mappingEntities = new MultiKeyMap();
            this.mappingRelationships.add(relationship, mappingEntities);
        }
        return mappingEntities;
    }

    private assertProperty(entity, property) {
        if (!entity.hasOwnProperty(property)) {
            throw new Error("Couldn't find property \"" + property + "\" on entity: " + entity.constructor.toString());
        }
    };

    private observeOneToOne(entity) {

        var relationships = this.edm.getOneToOneRelationships(entity);
        relationships.forEach((relationship) => {
            var property = relationship.hasOne;

            if (typeof property !== "undefined") {

                this.assertProperty(entity, property);

                var withOneSetter = relationship.withOne;
                var withForeignKeySetter = relationship.withForeignKey;
                var key = relationship.hasKey;

                var action = (e) => {
                    var oldTarget = e.oldValue;
                    var newTarget = e.newValue;
                    //self.add(oldTarget);
                    this.add(newTarget);

                    if (typeof withOneSetter !== "undefined") {
                        if (oldTarget && oldTarget[relationship.withForeignKey] === entity[relationship.hasKey]) {
                            oldTarget[withOneSetter] = null;
                            var primaryKeyHash = this.edm.getPrimaryKeyProperties(relationship.ofType).reduce((hash, name) => {
                                hash[name] = true;
                                return hash;
                            }, {});

                            if (!primaryKeyHash[withForeignKeySetter]) {
                                oldTarget[withForeignKeySetter] = null;
                            }

                            if (relationship.optional !== true) {
                                this.remove(oldTarget);
                            }
                        }

                        if (newTarget && newTarget[relationship.withOne] !== entity) {
                            newTarget[withOneSetter] = entity;
                        }
                    }

                    if (entity[key] === null) {
                        var idObserver = entity.observeProperty(key, (e) => {
                            if (entity[property] !== null) {
                                entity[property][withForeignKeySetter] = e.newValue;
                            }
                            idObserver.dispose();
                        });

                    } else {
                        if (newTarget !== null) {
                            newTarget[withForeignKeySetter] = entity[key];
                        }
                    }

                };
                    
                // Link if there is a entity already there.
                action({
                    oldValue: null,
                    newValue: entity[property]
                });


                var observer = entity.observeProperty(property, action);
                this.oneToOneObservers.add(entity, property, observer);
            }
        });

    };

    observeOneToOneAsTarget(entity) {
        var Type = entity.constuctor;
        var relationships = this.edm.getOneToOneAsTargetRelationships(entity);

        relationships.forEach((relationship) => {
            var property = relationship.withOne;

            if (typeof property !== "undefined") {
                this.assertProperty(entity, property);

                var hasOneSetter = relationship.hasOne;

                var action = (e) => {
                    var oldSource = e.oldValue;
                    var newSource = e.newValue;
                        
                    //self.add(oldSource);
                    this.add(newSource);

                    if (typeof hasOneSetter !== "undefined") {
                        if (oldSource && oldSource[relationship.hasOne] === entity) {
                            oldSource[hasOneSetter] = null;
                        }

                        if (newSource && newSource[relationship.hasOne] !== entity) {
                            newSource[hasOneSetter] = entity;
                        }
                    } else {
                        if (newSource !== null) {
                            if (newSource[relationship.hasKey] === null) {
                                var idObserver = newSource.observeProperty(relationship.hasKey, (e) => {
                                    if (entity[property] === newSource) {
                                        entity[relationship.withForeignKey] = e.newValue;
                                    }
                                    idObserver.dispose();
                                });
                            } else {
                                entity[relationship.withForeignKey] = newSource[relationship.hasKey];
                            }
                        }
                    }
                };
                // Link if there is a entity already there.
                action({
                    oldValue: null,
                    newValue: entity[property],
                    isSetUp: true
                });

                var observer = entity.observeProperty(property, action);
                this.oneToOneAsTargetObservers.add(entity, property, observer);
            }
        });

    };

    private observeOneToMany(entity) {
        var relationships = this.edm.getOneToManyRelationships(entity);

        relationships.forEach((relationship) => {
            var property = relationship.hasMany;

            if (typeof property !== "undefined") {
                this.assertProperty(entity, property);

                var withOneSetter = relationship.withOne;
                var withForeignKeySetter = relationship.withForeignKey;
                var key = relationship.hasKey;

                var action = (e) => {
                    var newItems = e.newItems;
                    var oldItems = e.oldItems;

                    newItems.forEach((item) => {
                        this.add(item);
                        if (typeof withOneSetter !== "undefined") {
                            item[withOneSetter] = entity;
                        }

                        if (entity[key] === null) {
                            var idObserver = entity.observeProperty(key, (e) => {
                                if (item && entity[property].indexOf(item) > -1) {
                                    item[withForeignKeySetter] = e.newValue;
                                }
                                idObserver.dispose();
                            });
                        } else {
                            if (item !== null) {
                                item[withForeignKeySetter] = entity[key];
                            }
                        }
                    });

                    oldItems.forEach((item) => {
                        // Detach from entity if its still bound.
                        if (item[relationship.withForeignKey] === entity[relationship.hasKey]) {
                            if (typeof withOneSetter !== "undefined") {
                                item[withOneSetter] = null;
                            }
                            item[withForeignKeySetter] = null;

                            if (relationship.optional !== true) {
                                this.remove(item);
                            }
                        }

                    });

                };

                action({
                    oldItems: [],
                    newItems: entity[property].slice(0)
                });

                ObservableArray.apply(entity[property]);

                var observer = entity[property].observe(action);
                this.oneToManyObservers.add(entity, property, observer);
            }
        });
    };

    private observeOneToManyAsTarget(entity) {
        var relationships = this.edm.getOneToManyAsTargetRelationships(entity);

        relationships.forEach((relationship) => {
            var property = relationship.withOne;

            if (typeof property !== "undefined") {
                this.assertProperty(entity, property);

                var action = (e) => {
                    var oldValue = e.oldValue;
                    var newValue = e.newValue;

                    this.add(newValue);

                    if (typeof relationship.hasMany !== "undefined") {

                        if (oldValue) {
                            if (relationship.optional === true) {
                                oldValue[relationship.hasMany].unload(entity);
                            } else {
                                oldValue[relationship.hasMany].remove(entity);
                            }
                        }

                        if (newValue) {
                            var index = newValue[relationship.hasMany].indexOf(entity);
                            if (index === -1) {
                                newValue[relationship.hasMany].push(entity);
                            }
                        }

                    } else {
                        if (newValue !== null) {
                            if (newValue[relationship.hasKey] === null) {
                                var idObserver = newValue.observeProperty(relationship.hasKey, (e) => {
                                    if (entity[property] === newValue) {
                                        entity[relationship.withForeignKey] = e.newValue;
                                    }
                                    idObserver.dispose();
                                });
                            } else {
                                entity[relationship.withForeignKey] = newValue[relationship.hasKey];
                            }
                        }
                    }
                };

                action({
                    oldValue: null,
                    newValue: entity[property]
                });

                var observer = entity.observeProperty(property, action);
                this.oneToManyAsTargetObservers.add(entity, property, observer);
            }
        });
    };

    observeManyToMany(entity) {
        var relationships = this.edm.getManyToManyRelationships(entity);

        relationships.forEach((relationship) => {
            var property = relationship.hasMany;
            if (typeof property !== "undefined") {

                this.assertProperty(entity, property);

                var action = (e) => {
                    var oldItems = e.oldItems;
                    var newItems = e.newItems;

                    var mappingEntities = this.getMappingEntities(relationship);

                    oldItems.forEach((target) => {

                        if (typeof relationship.withMany !== "undefined") {
                            var targetArray = target[relationship.withMany];
                            targetArray.unload(entity);
                        }

                        var mappingEntity = mappingEntities.remove(entity, target);
                        var MappingEntity;

                        if (mappingEntity === null) {
                            MappingEntity = relationship.usingMappingType;
                            mappingEntity = this.createMappingEntity(MappingEntity, target, entity, relationship);
                        }

                        this.notify({
                            type: "entityRemoved",
                            entity: mappingEntity
                        });
                    });

                    newItems.forEach((target) => {
                        this.add(target);

                        if (typeof relationship.withMany !== "undefined") {
                            var targetArray = target[relationship.withMany];
                            var index = targetArray.indexOf(entity);

                            if (index === -1) {
                                targetArray.push(entity);
                            }
                        }

                        var mappingEntity = mappingEntities.get(entity, target);
                        var MappingEntity;

                        if (mappingEntity === null) {
                            MappingEntity = relationship.usingMappingType;
                            mappingEntity = this.createMappingEntity(MappingEntity, target, entity, relationship);

                            mappingEntities.add(entity, target, mappingEntity);
                        }

                        this.add(mappingEntity);

                    });

                };

                action({
                    oldItems: [],
                    newItems: entity[property].slice(0)
                });

                ObservableArray.apply(entity[property]);
                var observer = entity[property].observe(action);
                this.manyToManyObservers.add(entity, property, observer);
            }
        });
    };

    private observeManyToManyAsTarget(entity) {
        var Type = entity.constructor;
        var relationships = this.edm.getManyToManyAsTargetRelationships(entity);

        relationships.forEach((relationship) => {
            var property = relationship.withMany;
            if (typeof property !== "undefined") {

                this.assertProperty(entity, property);

                var action = (e) => {
                    var oldItems = e.oldItems;
                    var newItems = e.newItems;

                    var mappingEntities = this.getMappingEntities(relationship);

                    oldItems.forEach((source) => {

                        if (typeof relationship.hasMany !== "undefined") {
                            var sourceArray = source[relationship.hasMany];
                            sourceArray.unload(entity);
                        }

                        var mappingEntity = mappingEntities.remove(source, entity);
                        var MappingEntity;

                        if (mappingEntity === null) {
                            MappingEntity = relationship.usingMappingType;
                            mappingEntity = this.createMappingEntity(MappingEntity, entity, source, relationship);
                        }

                        this.notify({
                            type: "entityRemoved",
                            entity: mappingEntity
                        });

                    });

                    newItems.forEach((source) => {
                        this.add(source);

                        if (typeof relationship.hasMany !== "undefined") {
                            var sourceArray = source[relationship.hasMany];
                            var index = sourceArray.indexOf(entity);

                            if (index === -1) {
                                sourceArray.push(entity);
                            }
                        }

                        var mappingEntity = mappingEntities.get(source, entity);
                        var MappingEntity;

                        if (mappingEntity === null) {
                            MappingEntity = relationship.usingMappingType;
                            mappingEntity = this.createMappingEntity(MappingEntity, entity, source, relationship);

                            mappingEntities.add(source, entity, mappingEntity);
                        }

                        this.add(mappingEntity);

                    });
                };

                action({
                    oldItems: [],
                    newItems: entity[property].slice(0)
                });

                ObservableArray.apply(entity[property]);

                var observer = entity[property].observe(action);
                this.manyToManyAsTargetObservers.add(entity, property, observer);
            }
        });

    };

    private unobserveOneToOne(entity) {
        var observers = this.oneToOneObservers.remove(entity);
        if (observers) {
            observers.getValues().forEach((observer) => {
                observer.dispose();
            });
        }
    };

    private unobserveOneToOneAsTargets(entity) {
        var observers = this.oneToOneAsTargetObservers.remove(entity);
        if (observers) {
            observers.getValues().forEach((observer) => {
                observer.dispose();
            });
        }
    };

    private unobserveOneToMany(entity) {
        var observers = this.oneToManyObservers.remove(entity);
        if (observers) {
            observers.getValues().forEach((observer) => {
                observer.dispose();
            });
        }
    };

    private unobserveOneToManyAsTargets(entity) {
        var observers = this.oneToManyAsTargetObservers.remove(entity);
        if (observers) {
            observers.getValues().forEach((observer) => {
                observer.dispose();
            });
        }
    };

    private unobserveManyToMany(entity) {
        var observers = this.manyToManyObservers.remove(entity);
        if (observers) {
            observers.getValues().forEach((observer) => {
                observer.dispose();
            });
        }
    };

    private unobserveManyToManyAsTargets(entity) {
        var observers = this.manyToManyAsTargetObservers.remove(entity);
        if (observers) {
            observers.getValues().forEach((observer) => {
                observer.dispose();
            });
        }
    };

    private observeEntity(entity) {
        this.observeOneToOne(entity);
        this.observeOneToOneAsTarget(entity);
        this.observeOneToMany(entity);
        this.observeOneToManyAsTarget(entity);
        this.observeManyToMany(entity);
        this.observeManyToManyAsTarget(entity);
    };

    private unobserveEntity(entity) {
        this.unobserveOneToOne(entity);
        this.unobserveOneToOneAsTargets(entity);
        this.unobserveOneToMany(entity);
        this.unobserveOneToManyAsTargets(entity);
        this.unobserveManyToMany(entity);
        this.unobserveManyToManyAsTargets(entity);
    };


    constructor(edm: EdmPackage.Edm) {
        super();

        this.oneToOneObservers = new MultiKeyMap();
        this.oneToOneAsTargetObservers = new MultiKeyMap();
        this.oneToManyObservers = new MultiKeyMap();
        this.oneToManyAsTargetObservers = new MultiKeyMap();
        this.manyToManyObservers = new MultiKeyMap();
        this.manyToManyAsTargetObservers = new MultiKeyMap();

        this.mappingRelationships = new Hashmap();
        this.addedEntities = new Hashmap();
    }

    attach(entity) {
        if (entity && !this.addedEntities.hasKey(entity)) {
            this.addedEntities.add(entity, entity);

            PropertyBehavior.apply(entity);

            this.observeEntity(entity);

            this.notify({
                type: "entityAttached",
                entity: entity
            });
        }
    };

    add(entity) {
        if (entity && !this.addedEntities.hasKey(entity)) {
            this.addedEntities.add(entity, entity);

            PropertyBehavior.apply(entity);

            this.observeEntity(entity);

            this.notify({
                type: "entityAdded",
                entity: entity
            });
        }
    };

    remove(entity) {
        if (entity && this.addedEntities.hasKey(entity)) {
            this.addedEntities.remove(entity);

            this.unobserveEntity(entity);

            this.notify({
                type: "entityRemoved",
                entity: entity
            });
        }
    };

    detach(entity) {
        if (entity && this.addedEntities.hasKey(entity)) {
            this.addedEntities.remove(entity);

            this.unobserveEntity(entity);

            this.notify({
                type: "entityDetached",
                entity: entity
            });
        }
    };
}

export = Orm;