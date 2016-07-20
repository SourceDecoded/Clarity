var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
define(["require", "exports", "../collections/MultiKeyMap", "../collections/Hashmap", "../util/PropertyBehavior", "../collections/ObservableArray", "../util/Observable"], function (require, exports, MultiKeyMap, Hashmap, PropertyBehavior, ObservableArray, Observable) {
    var Orm = (function (_super) {
        __extends(Orm, _super);
        function Orm(edm) {
            _super.call(this);
            this.oneToOneObservers = new MultiKeyMap();
            this.oneToOneAsTargetObservers = new MultiKeyMap();
            this.oneToManyObservers = new MultiKeyMap();
            this.oneToManyAsTargetObservers = new MultiKeyMap();
            this.manyToManyObservers = new MultiKeyMap();
            this.manyToManyAsTargetObservers = new MultiKeyMap();
            this.mappingRelationships = new Hashmap();
            this.addedEntities = new Hashmap();
        }
        Orm.prototype.createMappingEntity = function (Type, target, source, relationship) {
            var mappingEntity = new Type();
            var targetKey = relationship.withKey;
            var sourceKey = relationship.hasKey;
            mappingEntity[relationship.hasForeignKey] = target[targetKey];
            mappingEntity[relationship.withForeignKey] = source[sourceKey];
            mappingEntity.source = source;
            mappingEntity.target = target;
            mappingEntity.relationship = relationship;
            if (target[targetKey] === null) {
                var targetObserver = target.observeProperty(targetKey, function (e) {
                    mappingEntity[relationship.hasForeignKey] = target[targetKey];
                    targetObserver.dispose();
                });
            }
            if (source[sourceKey] === null) {
                var sourceObserver = source.observeProperty(sourceKey, function (e) {
                    mappingEntity[relationship.withForeignKey] = source[sourceKey];
                    sourceObserver.dispose();
                });
            }
            return mappingEntity;
        };
        Orm.prototype.getMappingEntities = function (relationship) {
            var mappingEntities = this.mappingRelationships.get(relationship);
            if (mappingEntities === null) {
                mappingEntities = new MultiKeyMap();
                this.mappingRelationships.add(relationship, mappingEntities);
            }
            return mappingEntities;
        };
        Orm.prototype.assertProperty = function (entity, property) {
            if (!entity.hasOwnProperty(property)) {
                throw new Error("Couldn't find property \"" + property + "\" on entity: " + entity.constructor.toString());
            }
        };
        ;
        Orm.prototype.observeOneToOne = function (entity) {
            var _this = this;
            var relationships = this.edm.getOneToOneRelationships(entity);
            relationships.forEach(function (relationship) {
                var property = relationship.hasOne;
                if (typeof property !== "undefined") {
                    _this.assertProperty(entity, property);
                    var withOneSetter = relationship.withOne;
                    var withForeignKeySetter = relationship.withForeignKey;
                    var key = relationship.hasKey;
                    var action = function (e) {
                        var oldTarget = e.oldValue;
                        var newTarget = e.newValue;
                        //self.add(oldTarget);
                        _this.add(newTarget);
                        if (typeof withOneSetter !== "undefined") {
                            if (oldTarget && oldTarget[relationship.withForeignKey] === entity[relationship.hasKey]) {
                                oldTarget[withOneSetter] = null;
                                var primaryKeyHash = _this.edm.getPrimaryKeyProperties(relationship.ofType).reduce(function (hash, name) {
                                    hash[name] = true;
                                    return hash;
                                }, {});
                                if (!primaryKeyHash[withForeignKeySetter]) {
                                    oldTarget[withForeignKeySetter] = null;
                                }
                                if (relationship.optional !== true) {
                                    _this.remove(oldTarget);
                                }
                            }
                            if (newTarget && newTarget[relationship.withOne] !== entity) {
                                newTarget[withOneSetter] = entity;
                            }
                        }
                        if (entity[key] === null) {
                            var idObserver = entity.observeProperty(key, function (e) {
                                if (entity[property] !== null) {
                                    entity[property][withForeignKeySetter] = e.newValue;
                                }
                                idObserver.dispose();
                            });
                        }
                        else {
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
                    _this.oneToOneObservers.add(entity, property, observer);
                }
            });
        };
        ;
        Orm.prototype.observeOneToOneAsTarget = function (entity) {
            var _this = this;
            var Type = entity.constuctor;
            var relationships = this.edm.getOneToOneAsTargetRelationships(entity);
            relationships.forEach(function (relationship) {
                var property = relationship.withOne;
                if (typeof property !== "undefined") {
                    _this.assertProperty(entity, property);
                    var hasOneSetter = relationship.hasOne;
                    var action = function (e) {
                        var oldSource = e.oldValue;
                        var newSource = e.newValue;
                        //self.add(oldSource);
                        _this.add(newSource);
                        if (typeof hasOneSetter !== "undefined") {
                            if (oldSource && oldSource[relationship.hasOne] === entity) {
                                oldSource[hasOneSetter] = null;
                            }
                            if (newSource && newSource[relationship.hasOne] !== entity) {
                                newSource[hasOneSetter] = entity;
                            }
                        }
                        else {
                            if (newSource !== null) {
                                if (newSource[relationship.hasKey] === null) {
                                    var idObserver = newSource.observeProperty(relationship.hasKey, function (e) {
                                        if (entity[property] === newSource) {
                                            entity[relationship.withForeignKey] = e.newValue;
                                        }
                                        idObserver.dispose();
                                    });
                                }
                                else {
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
                    _this.oneToOneAsTargetObservers.add(entity, property, observer);
                }
            });
        };
        ;
        Orm.prototype.observeOneToMany = function (entity) {
            var _this = this;
            var relationships = this.edm.getOneToManyRelationships(entity);
            relationships.forEach(function (relationship) {
                var property = relationship.hasMany;
                if (typeof property !== "undefined") {
                    _this.assertProperty(entity, property);
                    var withOneSetter = relationship.withOne;
                    var withForeignKeySetter = relationship.withForeignKey;
                    var key = relationship.hasKey;
                    var action = function (e) {
                        var newItems = e.newItems;
                        var oldItems = e.oldItems;
                        newItems.forEach(function (item) {
                            _this.add(item);
                            if (typeof withOneSetter !== "undefined") {
                                item[withOneSetter] = entity;
                            }
                            if (entity[key] === null) {
                                var idObserver = entity.observeProperty(key, function (e) {
                                    if (item && entity[property].indexOf(item) > -1) {
                                        item[withForeignKeySetter] = e.newValue;
                                    }
                                    idObserver.dispose();
                                });
                            }
                            else {
                                if (item !== null) {
                                    item[withForeignKeySetter] = entity[key];
                                }
                            }
                        });
                        oldItems.forEach(function (item) {
                            // Detach from entity if its still bound.
                            if (item[relationship.withForeignKey] === entity[relationship.hasKey]) {
                                if (typeof withOneSetter !== "undefined") {
                                    item[withOneSetter] = null;
                                }
                                item[withForeignKeySetter] = null;
                                if (relationship.optional !== true) {
                                    _this.remove(item);
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
                    _this.oneToManyObservers.add(entity, property, observer);
                }
            });
        };
        ;
        Orm.prototype.observeOneToManyAsTarget = function (entity) {
            var _this = this;
            var relationships = this.edm.getOneToManyAsTargetRelationships(entity);
            relationships.forEach(function (relationship) {
                var property = relationship.withOne;
                if (typeof property !== "undefined") {
                    _this.assertProperty(entity, property);
                    var action = function (e) {
                        var oldValue = e.oldValue;
                        var newValue = e.newValue;
                        _this.add(newValue);
                        if (typeof relationship.hasMany !== "undefined") {
                            if (oldValue) {
                                if (relationship.optional === true) {
                                    oldValue[relationship.hasMany].unload(entity);
                                }
                                else {
                                    oldValue[relationship.hasMany].remove(entity);
                                }
                            }
                            if (newValue) {
                                var index = newValue[relationship.hasMany].indexOf(entity);
                                if (index === -1) {
                                    newValue[relationship.hasMany].push(entity);
                                }
                            }
                        }
                        else {
                            if (newValue !== null) {
                                if (newValue[relationship.hasKey] === null) {
                                    var idObserver = newValue.observeProperty(relationship.hasKey, function (e) {
                                        if (entity[property] === newValue) {
                                            entity[relationship.withForeignKey] = e.newValue;
                                        }
                                        idObserver.dispose();
                                    });
                                }
                                else {
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
                    _this.oneToManyAsTargetObservers.add(entity, property, observer);
                }
            });
        };
        ;
        Orm.prototype.observeManyToMany = function (entity) {
            var _this = this;
            var relationships = this.edm.getManyToManyRelationships(entity);
            relationships.forEach(function (relationship) {
                var property = relationship.hasMany;
                if (typeof property !== "undefined") {
                    _this.assertProperty(entity, property);
                    var action = function (e) {
                        var oldItems = e.oldItems;
                        var newItems = e.newItems;
                        var mappingEntities = _this.getMappingEntities(relationship);
                        oldItems.forEach(function (target) {
                            if (typeof relationship.withMany !== "undefined") {
                                var targetArray = target[relationship.withMany];
                                targetArray.unload(entity);
                            }
                            var mappingEntity = mappingEntities.remove(entity, target);
                            var MappingEntity;
                            if (mappingEntity === null) {
                                MappingEntity = relationship.usingMappingType;
                                mappingEntity = _this.createMappingEntity(MappingEntity, target, entity, relationship);
                            }
                            _this.notify({
                                type: "entityRemoved",
                                entity: mappingEntity
                            });
                        });
                        newItems.forEach(function (target) {
                            _this.add(target);
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
                                mappingEntity = _this.createMappingEntity(MappingEntity, target, entity, relationship);
                                mappingEntities.add(entity, target, mappingEntity);
                            }
                            _this.add(mappingEntity);
                        });
                    };
                    action({
                        oldItems: [],
                        newItems: entity[property].slice(0)
                    });
                    ObservableArray.apply(entity[property]);
                    var observer = entity[property].observe(action);
                    _this.manyToManyObservers.add(entity, property, observer);
                }
            });
        };
        ;
        Orm.prototype.observeManyToManyAsTarget = function (entity) {
            var _this = this;
            var Type = entity.constructor;
            var relationships = this.edm.getManyToManyAsTargetRelationships(entity);
            relationships.forEach(function (relationship) {
                var property = relationship.withMany;
                if (typeof property !== "undefined") {
                    _this.assertProperty(entity, property);
                    var action = function (e) {
                        var oldItems = e.oldItems;
                        var newItems = e.newItems;
                        var mappingEntities = _this.getMappingEntities(relationship);
                        oldItems.forEach(function (source) {
                            if (typeof relationship.hasMany !== "undefined") {
                                var sourceArray = source[relationship.hasMany];
                                sourceArray.unload(entity);
                            }
                            var mappingEntity = mappingEntities.remove(source, entity);
                            var MappingEntity;
                            if (mappingEntity === null) {
                                MappingEntity = relationship.usingMappingType;
                                mappingEntity = _this.createMappingEntity(MappingEntity, entity, source, relationship);
                            }
                            _this.notify({
                                type: "entityRemoved",
                                entity: mappingEntity
                            });
                        });
                        newItems.forEach(function (source) {
                            _this.add(source);
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
                                mappingEntity = _this.createMappingEntity(MappingEntity, entity, source, relationship);
                                mappingEntities.add(source, entity, mappingEntity);
                            }
                            _this.add(mappingEntity);
                        });
                    };
                    action({
                        oldItems: [],
                        newItems: entity[property].slice(0)
                    });
                    ObservableArray.apply(entity[property]);
                    var observer = entity[property].observe(action);
                    _this.manyToManyAsTargetObservers.add(entity, property, observer);
                }
            });
        };
        ;
        Orm.prototype.unobserveOneToOne = function (entity) {
            var observers = this.oneToOneObservers.remove(entity);
            if (observers) {
                observers.getValues().forEach(function (observer) {
                    observer.dispose();
                });
            }
        };
        ;
        Orm.prototype.unobserveOneToOneAsTargets = function (entity) {
            var observers = this.oneToOneAsTargetObservers.remove(entity);
            if (observers) {
                observers.getValues().forEach(function (observer) {
                    observer.dispose();
                });
            }
        };
        ;
        Orm.prototype.unobserveOneToMany = function (entity) {
            var observers = this.oneToManyObservers.remove(entity);
            if (observers) {
                observers.getValues().forEach(function (observer) {
                    observer.dispose();
                });
            }
        };
        ;
        Orm.prototype.unobserveOneToManyAsTargets = function (entity) {
            var observers = this.oneToManyAsTargetObservers.remove(entity);
            if (observers) {
                observers.getValues().forEach(function (observer) {
                    observer.dispose();
                });
            }
        };
        ;
        Orm.prototype.unobserveManyToMany = function (entity) {
            var observers = this.manyToManyObservers.remove(entity);
            if (observers) {
                observers.getValues().forEach(function (observer) {
                    observer.dispose();
                });
            }
        };
        ;
        Orm.prototype.unobserveManyToManyAsTargets = function (entity) {
            var observers = this.manyToManyAsTargetObservers.remove(entity);
            if (observers) {
                observers.getValues().forEach(function (observer) {
                    observer.dispose();
                });
            }
        };
        ;
        Orm.prototype.observeEntity = function (entity) {
            this.observeOneToOne(entity);
            this.observeOneToOneAsTarget(entity);
            this.observeOneToMany(entity);
            this.observeOneToManyAsTarget(entity);
            this.observeManyToMany(entity);
            this.observeManyToManyAsTarget(entity);
        };
        ;
        Orm.prototype.unobserveEntity = function (entity) {
            this.unobserveOneToOne(entity);
            this.unobserveOneToOneAsTargets(entity);
            this.unobserveOneToMany(entity);
            this.unobserveOneToManyAsTargets(entity);
            this.unobserveManyToMany(entity);
            this.unobserveManyToManyAsTargets(entity);
        };
        ;
        Orm.prototype.attach = function (entity) {
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
        ;
        Orm.prototype.add = function (entity) {
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
        ;
        Orm.prototype.remove = function (entity) {
            if (entity && this.addedEntities.hasKey(entity)) {
                this.addedEntities.remove(entity);
                this.unobserveEntity(entity);
                this.notify({
                    type: "entityRemoved",
                    entity: entity
                });
            }
        };
        ;
        Orm.prototype.detach = function (entity) {
            if (entity && this.addedEntities.hasKey(entity)) {
                this.addedEntities.remove(entity);
                this.unobserveEntity(entity);
                this.notify({
                    type: "entityDetached",
                    entity: entity
                });
            }
        };
        ;
        return Orm;
    })(Observable);
    return Orm;
});
