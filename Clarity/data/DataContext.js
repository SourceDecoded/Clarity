var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
define(["require", "exports", "../async/Future", "./ChangeTracker", "./Orm", "./DataSet", "./Entity", "../collections/Hashmap", "../collections/MultiKeyMap", "../query/Provider", "../query/Queryable", "../util/Observable", "./responses/EntityNotFoundErrorResponse", "../query/ArrayProvider"], function (require, exports, Future, ChangeTracker, Orm, DataSet, Entity, Hashmap, MultiKeyMap, Provider, Queryable, Observable, EntityNotFoundErrorResponse, ArrayProvider) {
    var emptyFuture = Future.fromResult(undefined);
    var emptyQueryable = [].asQueryable();
    var flattenMultiKeyMap = function (multiKeyMap) {
        var keys = multiKeyMap.getKeys();
        return keys.reduce(function (array, key) {
            return array.concat(multiKeyMap.get(key).getValues());
        }, []);
    };
    var DataContext = (function (_super) {
        __extends(DataContext, _super);
        function DataContext(service) {
            var _this = this;
            _super.call(this);
            this.attachEntity = function (entity) {
                this.orm.attach(entity);
            };
            if (service == null) {
                throw new Error("Data Context needs to have a service.");
            }
            this.edm = this.service.getEdm();
            this.orm = new Orm(this.edm);
            this.changeTrackersHash = new Hashmap();
            this.loadedBucket = new MultiKeyMap();
            this.addedBucket = new MultiKeyMap();
            this.updatedBucket = new MultiKeyMap();
            this.removedBucket = new MultiKeyMap();
            this.sequenceBucket = [];
            this.transactionId = 0;
            // Add DataSets
            this.edm.getModels().getValues().forEach(function (model) {
                if (model.collectionName) {
                    _this[model.collectionName] = new DataSet(model.type, self);
                }
            });
            this.orm.observeType("entityAdded", function (e) {
                var entity = e.entity;
                Entity.apply(entity);
                var changeTracker = _this.setUpChangeTracker(entity);
                if (_this.hasAllPrimaryKeys(entity)) {
                    changeTracker.setStateToLoaded();
                }
                else {
                    changeTracker.add();
                    _this.notify({
                        type: "added",
                        Type: entity.constructor,
                        entity: entity
                    });
                }
            });
            this.orm.observeType("entityRemoved", function (e) {
                var entity = e.entity;
                var changeTracker = _this.changeTrackersHash.get(entity);
                // This only happens with Many to Many.
                // I really don't like this. Its a broken pattern. I've missed something somewhere.
                if (!changeTracker) {
                    changeTracker = _this.setUpChangeTracker(entity);
                    changeTracker.setStateToLoaded();
                }
                changeTracker.remove();
                _this.notify({
                    type: "removed",
                    Type: entity.constructor,
                    entity: entity
                });
            });
            this.orm.observeType("entityDetached", function (e) {
                var entity = e.entity;
                var changeTracker = _this.changeTrackersHash.remove(entity);
                if (!changeTracker) {
                    return;
                }
                entity.__dataContext__ = null;
                changeTracker.detach();
                _this.notify({
                    type: "detached",
                    Type: entity.constructor,
                    entity: entity
                });
            });
            this.orm.observeType("entityAttached", function (e) {
                var entity = e.entity;
                Entity.apply(entity);
                this.attachEntity(entity);
                this.notify({
                    type: "attached",
                    Type: entity.constructor,
                    entity: entity
                });
            });
        }
        DataContext.prototype.removeEntityFromChangeTrackerBuckets = function (entity) {
            this.addedBucket.remove(entity.constructor, entity);
            this.updatedBucket.remove(entity.constructor, entity);
            this.removedBucket.remove(entity.constructor, entity);
            var index = this.sequenceBucket.indexOf(entity);
            if (index >= 0) {
                this.sequenceBucket.splice(index, 1);
            }
        };
        DataContext.prototype.saveEntityDependenciesSequentially = function (entity) {
            var _this = this;
            var oneToOne = this.edm.getOneToOneAsTargetRelationships(entity);
            var oneToMany = this.edm.getOneToManyAsTargetRelationships(entity);
            var dependencies = oneToOne.concat(oneToMany);
            return dependencies.filter(function (relationship) {
                return !relationship.optional;
            }).reduce(function (future, relationship) {
                var property = relationship.withOne;
                var source = entity[property];
                if (source) {
                    return future.chain(function () {
                        return _this.saveEntitySequentially(source);
                    });
                }
                return future;
            }, emptyFuture);
        };
        ;
        DataContext.prototype.saveEntityDependencies = function (entity) {
            var _this = this;
            var oneToOne = this.edm.getOneToOneAsTargetRelationships(entity);
            var oneToMany = this.edm.getOneToManyAsTargetRelationships(entity);
            var dependencies = oneToOne.concat(oneToMany);
            return Future.all(dependencies.filter(function (relationship) {
                return !relationship.optional;
            }).map(function (relationship) {
                var property = relationship.withOne;
                var source = entity[property];
                if (source) {
                    return _this.saveEntity(source);
                }
                return emptyFuture;
            }));
        };
        DataContext.prototype.createSourcesOneToOneProvider = function (entity, relationship) {
            var _this = this;
            if (typeof relationship.hasOne !== "undefined") {
                entity.registerProvider(relationship.hasOne, function (entity) {
                    return _this.service.getSourcesOneToOneTargetEntity(entity, relationship).chain(function (target) {
                        if (target !== null) {
                            var loadedTarget = _this.loadEntityByType(relationship.ofType, target);
                            return loadedTarget;
                        }
                        else {
                            return target;
                        }
                    })["catch"](function (error) {
                        if (error instanceof EntityNotFoundErrorResponse) {
                            return null;
                        }
                        else {
                            return Future.fromError(error);
                        }
                    });
                });
            }
        };
        DataContext.prototype.createTargetsOneToOneProvider = function (entity, relationship) {
            var _this = this;
            if (typeof relationship.withOne !== "undefined") {
                entity.registerProvider(relationship.withOne, function (entity) {
                    return _this.service.getTargetsOneToOneSourceEntity(entity, relationship).chain(function (source) {
                        if (source !== null) {
                            var loadedSource = _this.loadEntityByType(relationship.type, source);
                            return loadedSource;
                        }
                        else {
                            return source;
                        }
                    }).chain(function (error) {
                        if (error instanceof EntityNotFoundErrorResponse) {
                            return null;
                        }
                        else {
                            return Future.fromError(error);
                        }
                    });
                });
            }
        };
        DataContext.prototype.createTargetsOneToManyProvider = function (entity, relationship) {
            var _this = this;
            if (typeof relationship.withOne !== "undefined") {
                entity.registerProvider(relationship.withOne, function (entity) {
                    return _this.service.getTargetsOneToManySourceEntity(entity, relationship).chain(function (source) {
                        if (source !== null) {
                            var loadedSource = _this.loadEntityByType(relationship.type, source);
                            return loadedSource;
                        }
                        else {
                            return source;
                        }
                    });
                });
            }
        };
        DataContext.prototype.createOneToManyProvider = function (entity, fillArray, relationship) {
            var _this = this;
            var provider = new Provider();
            var sourcesProvider = this.service.getSourcesOneToManyQueryProvider(entity, relationship);
            provider.toArray = provider.execute = function (queryable) {
                var queryableCopy = queryable.copy();
                queryableCopy.provider = sourcesProvider;
                if (provider === null) {
                    throw new Error("Couldn't find a provider for type.");
                }
                return queryableCopy.toArray().chain(function (dtos) {
                    var entities = _this.loadEntities(relationship.ofType, dtos);
                    entities.forEach(function (entity) {
                        if (fillArray.indexOf(entity) === -1) {
                            fillArray.load(entity);
                        }
                    });
                    return entities;
                });
            };
            provider.count = sourcesProvider.count;
            return provider;
        };
        DataContext.prototype.createManyToManyProvider = function (entity, fillArray, relationship) {
            var provider = new Provider();
            var sourcesProvider = this.service.getSourcesManyToManyQueryProvider(entity, relationship);
            provider.toArray = provider.execute = function (queryable) {
                var queryableCopy = queryable.copy();
                queryableCopy.provider = sourcesProvider;
                if (provider === null) {
                    throw new Error("Couldn't find provider for type.");
                }
                return queryableCopy.toArray().chain(function (dtos) {
                    var entities = this.loadEntities(relationship.ofType, dtos);
                    entities.forEach(function (entity) {
                        if (fillArray.indexOf(entity) === -1) {
                            fillArray.load(entity);
                        }
                    });
                    return entities;
                });
            };
            provider.count = sourcesProvider.count;
            return provider;
        };
        DataContext.prototype.createManyToManyAsTargetProvider = function (entity, fillArray, relationship) {
            var _this = this;
            var provider = new Provider();
            var targetsProvider = this.service.getTargetsManyToManyQueryProvider(entity, relationship);
            provider.toArray = provider.execute = function (queryable) {
                var provider = targetsProvider;
                var queryableCopy = queryable.copy();
                queryableCopy.provider = provider;
                if (provider === null) {
                    throw new Error("Couldn't find provider for type.");
                }
                queryableCopy.toArray().chain(function (dtos) {
                    var entities = _this.loadEntities(relationship.type, dtos);
                    entities.forEach(function (entity) {
                        if (fillArray.indexOf(entity) === -1) {
                            fillArray.load(entity);
                        }
                    });
                    return entities;
                });
            };
            provider.count = targetsProvider.count;
            return provider;
        };
        DataContext.prototype.addOneToOneProviders = function (entity) {
            var _this = this;
            var oneToOneRelationships = this.edm.getOneToOneRelationships(entity);
            var oneToOneAsTargetsRelationships = this.edm.getOneToOneAsTargetRelationships(entity);
            oneToOneRelationships.forEach(function (relationship) {
                _this.createSourcesOneToOneProvider(entity, relationship);
            });
            oneToOneAsTargetsRelationships.forEach(function (relationship) {
                _this.createTargetsOneToOneProvider(entity, relationship);
            });
        };
        DataContext.prototype.addOneToManyProviders = function (entity) {
            var _this = this;
            var oneToManyRelationships = this.edm.getOneToManyRelationships(entity);
            var oneToManyAsTargetsRelationships = this.edm.getOneToManyAsTargetRelationships(entity);
            oneToManyRelationships.forEach(function (relationship) {
                var property = relationship.hasMany;
                if (typeof property !== "undefined") {
                    var provider = _this.createOneToManyProvider(entity, entity[property], relationship);
                    entity[property].getProvider = function () { return provider; };
                }
            });
            oneToManyAsTargetsRelationships.forEach(function (relationship) {
                _this.createTargetsOneToManyProvider(entity, relationship);
            });
        };
        DataContext.prototype.addManyToManyProviders = function (entity) {
            var _this = this;
            var sourceRelationships = this.edm.getManyToManyRelationships(entity);
            var targetRelationships = this.edm.getManyToManyAsTargetRelationships(entity);
            sourceRelationships.forEach(function (relationship) {
                var property = relationship.hasMany;
                if (typeof property !== "undefined") {
                    var provider = _this.createManyToManyProvider(entity, entity[property], relationship);
                    entity[property].getProvider = function () { return provider; };
                }
            });
            targetRelationships.forEach(function (relationship) {
                var property = relationship.withMany;
                if (typeof property !== "undefined") {
                    var provider = _this.createManyToManyAsTargetProvider(entity, entity[property], relationship);
                    entity[property].getProvider = function () { return provider; };
                }
            });
        };
        DataContext.prototype.removeOneToOneProviders = function (entity) {
            var oneToOneRelationships = this.edm.getOneToOneRelationships(entity);
            var oneToOneAsTargetsRelationships = this.edm.getOneToOneAsTargetRelationships(entity);
            oneToOneRelationships.forEach(function (relationship) {
                entity.unregisterProvider(relationship.hasOne);
            });
            oneToOneAsTargetsRelationships.forEach(function (relationship) {
                entity.unregisterProvider(relationship.withOne);
            });
        };
        DataContext.prototype.removeOneToManyProviders = function (entity) {
            var oneToManyRelationships = this.edm.getOneToManyRelationships(entity);
            oneToManyRelationships.forEach(function (relationship) {
                var array = entity[relationship.hasMany];
                var provider = new ArrayProvider(array);
                array.getProvider = function () {
                    return provider;
                };
            });
        };
        DataContext.prototype.removeManyToManyProviders = function (entity) {
            var sourceRelationships = this.edm.getManyToManyRelationships(entity);
            var targetRelationships = this.edm.getManyToManyAsTargetRelationships(entity);
            sourceRelationships.forEach(function (relationship) {
                var array = entity[relationship.hasMany];
                var provider = new ArrayProvider(array);
                array.getProvider = function () {
                    return provider;
                };
            });
            targetRelationships.forEach(function (relationship) {
                var array = entity[relationship.withMany];
                var provider = new ArrayProvider(array);
                array.getProvider = function () {
                    return provider;
                };
            });
        };
        ;
        DataContext.prototype.getUniqueValue = function (entity) {
            var uniqueKey = {};
            var properties = this.edm.getPrimaryKeyProperties(entity.constructor);
            properties.forEach(function (key) {
                uniqueKey[key] = entity[key];
            });
            return JSON.stringify(uniqueKey);
        };
        ;
        DataContext.prototype.hasAllPrimaryKeys = function (entity) {
            var properties = this.edm.getPrimaryKeyProperties(entity.constructor);
            return properties.every(function (key) {
                return entity[key] !== null;
            });
        };
        ;
        DataContext.prototype.addRelationshipProviders = function (entity) {
            this.addOneToOneProviders(entity);
            this.addOneToManyProviders(entity);
            this.addManyToManyProviders(entity);
        };
        ;
        DataContext.prototype.removeRelationshipProviders = function (entity) {
            this.removeOneToOneProviders(entity);
            this.removeOneToManyProviders(entity);
            this.removeManyToManyProviders(entity);
        };
        ;
        DataContext.prototype.ormAttachEntity = function (entity) {
            var _this = this;
            var Type = entity.constructor;
            var loadedEntity = this.loadedBucket.get(Type, this.getUniqueValue(entity));
            if (loadedEntity === entity) {
                return;
            }
            if (loadedEntity !== null) {
                throw new Error("Entity was already attached to dataContext as a different entity.");
            }
            Object.keys(entity).forEach(function (key) {
                var value = entity[key];
                if (typeof value === "object" && value !== null) {
                    if (Array.isArray(value)) {
                        value.forEach(function (childEntity) {
                            _this.ormAttachEntity(childEntity);
                        });
                    }
                    else {
                        _this.ormAttachEntity(value);
                    }
                }
            });
            this.loadedBucket.add(Type, this.getUniqueValue(entity), entity);
            var changeTracker = this.setUpChangeTracker(entity);
            changeTracker.setStateToLoaded();
            this.notify({
                type: "attach",
                Type: entity.constructor,
                entity: entity
            });
        };
        ;
        DataContext.prototype.loadEntityByType = function (Type, dto) {
            var _this = this;
            var entity = this.loadedBucket.get(Type, this.getUniqueValue(dto));
            var primitives = this.edm.getPrimitiveTypes();
            if (entity === null) {
                entity = new Type();
                Object.keys(dto).forEach(function (key) {
                    var value = dto[key];
                    var Type;
                    if (value && key !== "constructor" && primitives.hasKey(value.constructor)) {
                        entity[key] = value;
                    }
                    else if (typeof value !== "undefined") {
                        entity[key] = value;
                    }
                    if (typeof value === "object" && value !== null) {
                        if (Array.isArray(value)) {
                            value.forEach(function (childEntity, index) {
                                var Type = childEntity.constructor;
                                childEntity = _this.loadEntityByType(Type, childEntity);
                                entity[key].splice(index, 1, childEntity);
                            });
                        }
                        else {
                            Type = value.constructor;
                            if (_this.edm.getModelByType(value.constructor) !== null) {
                                entity[key] = _this.loadEntityByType(Type, value);
                            }
                        }
                    }
                });
                this.loadedBucket.add(Type, this.getUniqueValue(entity), entity);
                this.addEntity(entity);
                this.notify({
                    type: "loaded",
                    Type: entity.constructor,
                    entity: entity
                });
            }
            else {
                this.syncEntity(entity, dto);
            }
            return entity;
        };
        DataContext.prototype.loadEntities = function (Type, dtos) {
            var _this = this;
            var entities = [];
            dtos.forEach(function (dto) {
                entities.push(_this.loadEntityByType(Type, dto));
            });
            return entities;
        };
        ;
        DataContext.prototype.getTransactionService = function (name) {
            var transactionService = null;
            if (typeof this.service.getTransactionService === "function") {
                transactionService = this.service.getTransactionService(name);
            }
            return transactionService;
        };
        ;
        DataContext.prototype.saveChangesWithTransaction = function (transactionService, name) {
            var _this = this;
            var savingEntityFutures = [];
            var mappingEntities = [];
            var mappingTypes = this.edm.getMappingTypes();
            var entitiesToSave = this.sequenceBucket.slice(0);
            this.transactionId++;
            transactionService.startTransaction(this.transactionId);
            entitiesToSave.forEach(function (entity) {
                if (mappingTypes.hasKey(entity.constructor)) {
                    mappingEntities.push(entity);
                }
                else {
                    var changeTracker = _this.changeTrackersHash.get(entity);
                    savingEntityFutures.push(changeTracker.save(transactionService));
                }
            });
            mappingEntities.forEach(function (entity) {
                savingEntityFutures.push(_this.saveEntity(entity));
            });
            transactionService.endTransaction(this.transactionId);
            return Future.all(savingEntityFutures);
        };
        ;
        DataContext.prototype.saveChanges = function (name) {
            var _this = this;
            var mappingTypes = this.edm.getMappingTypes();
            var transactionService = this.getTransactionService(name);
            var resultFutures;
            if (typeof name === "string" && transactionService === null) {
                throw new Error("Cannot find service for transaction.");
            }
            if (transactionService != null) {
                return this.saveChangesWithTransaction(transactionService, name);
            }
            // Put the mapping entities to the back.
            var entitiesToSave = this.sequenceBucket.slice(0).orderBy(function (entity) {
                if (mappingTypes.hasKey(entity.constructor)) {
                    return 1;
                }
                else {
                    return 0;
                }
            });
            return Future.all(entitiesToSave.map(function (entity) {
                return _this.saveEntityDependencies(entity);
            })).chain(function () {
                resultFutures = entitiesToSave.map(function (entity) {
                    var changeTracker = _this.changeTrackersHash.get(entity);
                    return changeTracker.save(_this.service);
                });
                return Future.all(resultFutures);
            }).chain(function () {
                return resultFutures;
            });
        };
        DataContext.prototype.loadEntity = function (entity) {
            return this.loadEntityByType(entity.constructor, entity);
        };
        DataContext.prototype.addEntity = function (entity) {
            this.orm.add(entity);
        };
        DataContext.prototype.removeEntity = function (entity) {
            this.orm.remove(entity);
        };
        DataContext.prototype.detachEntity = function (entity) {
            var changeTracker = this.changeTrackersHash.get(entity);
            if (changeTracker != null) {
                this.orm.detach(entity);
            }
        };
        DataContext.prototype.syncEntity = function (entity, dto) {
            var changeTracker = this.changeTrackersHash.get(entity);
            if (changeTracker !== null) {
                changeTracker.sync(dto);
            }
            else {
                throw new Error("Entity isn't part of the data context.");
            }
        };
        ;
        DataContext.prototype.saveChangesAsync = function (name) {
            return this.saveChanges(name).chain(function (futures) {
                var saveChangesResult = futures.reduce(function (saveChangesResult, future) {
                    if (future.error !== null) {
                        saveChangesResult.errorResponses.push(future.error);
                        saveChangesResult.responses.push(future.error);
                    }
                    else {
                        saveChangesResult.successResponses.push(future.value);
                        saveChangesResult.responses.push(future.value);
                    }
                    return saveChangesResult;
                }, {
                    errorResponses: [],
                    successResponses: [],
                    responses: []
                });
                if (saveChangesResult.errorResponses.length === 0) {
                    saveChangesResult.toString = function () { return "Successfully saved."; };
                    return Future.fromResult(saveChangesResult);
                }
                else {
                    var message;
                    var errorCount = saveChangesResult.errorResponses.length;
                    if (errorCount > 1) {
                        message = errorCount + " errors occurred while saving to database.";
                    }
                    else {
                        message = "An error occurred while saving to database.";
                    }
                    saveChangesResult.toString = function () { return message; };
                    return Future.fromError(saveChangesResult);
                }
            });
        };
        ;
        DataContext.prototype.saveChangesSequentially = function () {
            var _this = this;
            var savedEntityFutures = [];
            var mappingTypes = this.edm.getMappingTypes();
            var entitiesToSave = this.sequenceBucket.slice(0);
            // Put the mapping entities to the back.
            entitiesToSave.orderBy(function (entity) {
                if (mappingTypes.hasKey(entity.constructor)) {
                    return 1;
                }
                else {
                    return 0;
                }
            });
            return entitiesToSave.reduce(function (future, entity) {
                return future.chain(function () {
                    return _this.saveEntityDependenciesSequentially(entity);
                }).chain(function () {
                    var changeTracker = _this.changeTrackersHash.get(entity);
                    var savingFuture = changeTracker.save(_this.service);
                    savedEntityFutures.push(savingFuture);
                    return savingFuture;
                });
            }, emptyFuture);
        };
        ;
        DataContext.prototype.asQueryableLocal = function (Type) {
            var bucket = this.loadedBucket.get(Type);
            if (bucket !== null) {
                return bucket.getValues().asQueryable();
            }
            else {
                return emptyQueryable;
            }
        };
        ;
        DataContext.prototype.asQueryable = function (Type) {
            var queryable = new Queryable(Type);
            var provider = this.getQueryProvider(Type);
            queryable.provider = provider;
            return queryable;
        };
        ;
        DataContext.prototype.getQueryProvider = function (Type) {
            var provider = new Provider();
            var serviceProvider = this.service.getQueryProvider(Type);
            provider.toArray = provider.execute = function (queryable) {
                return serviceProvider.execute(queryable).chain(function (dtos) {
                    return this.loadEntities(Type, dtos);
                });
            };
            provider.count = serviceProvider.count;
            return provider;
        };
        ;
        DataContext.prototype.getOrm = function () {
            return this.orm;
        };
        ;
        DataContext.prototype.getPendingEntities = function () {
            return {
                added: flattenMultiKeyMap(this.addedBucket),
                removed: flattenMultiKeyMap(this.removedBucket),
                updated: flattenMultiKeyMap(this.updatedBucket)
            };
        };
        ;
        DataContext.prototype.getLoadedEntities = function () {
            return this.loadedBucket.copy();
        };
        ;
        DataContext.prototype.dispose = function () {
            var _this = this;
            this.changeTrackersHash.getKeys().forEach(function (entity) {
                _this.detachEntity(entity);
            });
        };
        ;
        // Removes all entities from the buckets.
        // The entities that are in the added state will be detached.
        // All the other entities will be set back to loaded.
        DataContext.prototype.purgeChangeTracker = function () {
            var _this = this;
            var buckets = this.getPendingEntities();
            var setToLoaded = function (entityData) {
                var changeTracker = _this.changeTrackersHash.get(entityData.entity);
                changeTracker.setStateToLoaded();
            };
            buckets.added.forEach(function (entityData) {
                var changeTracker = _this.changeTrackersHash.get(entityData.entity);
                changeTracker.setStateToDetached();
            });
            buckets.updated.forEach(setToLoaded);
            buckets.removed.forEach(setToLoaded);
        };
        ;
        DataContext.prototype.getService = function () {
            return this.service;
        };
        ;
        DataContext.prototype.setUpChangeTracker = function (entity) {
            var _this = this;
            if (entity.__dataContext__ != null && entity.__dataContext__ !== self) {
                throw new Error("Entity cannot be part of two contexts.");
            }
            entity.__dataContext__ = self;
            // As requested by Ben
            entity.save = function () {
                return _this.saveEntity(entity);
            };
            this.addRelationshipProviders(entity);
            var changeTracker = new ChangeTracker(entity, this.service);
            changeTracker.observeType("detached", function () {
                _this.loadedBucket.remove(entity.constructor, _this.getUniqueValue(entity));
                _this.addedBucket.remove(entity.constructor, entity);
                _this.updatedBucket.remove(entity.constructor, entity);
                _this.removedBucket.remove(entity.constructor, entity);
                _this.changeTrackersHash.remove(entity);
                _this.removeRelationshipProviders(entity);
                entity.__dataContext__ = null;
            });
            changeTracker.observeType("added", function () {
                _this.removeEntityFromChangeTrackerBuckets(entity);
                _this.addedBucket.add(entity.constructor, entity, {
                    entity: entity,
                    timestamp: performance.now()
                });
                _this.sequenceBucket.push(entity);
            });
            changeTracker.observeType("updated", function () {
                _this.removeEntityFromChangeTrackerBuckets(entity);
                _this.updatedBucket.add(entity.constructor, entity, {
                    entity: entity,
                    timestamp: performance.now()
                });
                _this.sequenceBucket.push(entity);
            });
            changeTracker.observeType("removed", function () {
                _this.removeEntityFromChangeTrackerBuckets(entity);
                _this.removedBucket.add(entity.constructor, entity, {
                    entity: entity,
                    timestamp: performance.now()
                });
                _this.sequenceBucket.push(entity);
            });
            changeTracker.observeType("loaded", function () {
                _this.removeEntityFromChangeTrackerBuckets(entity);
                // We want to use the entity's key as the key for the hash, so we can sync.
                _this.loadedBucket.add(entity.constructor, _this.getUniqueValue(entity), entity);
            });
            this.changeTrackersHash.add(entity, changeTracker);
            return changeTracker;
        };
        ;
        DataContext.prototype.saveEntitySequentially = function (entity) {
            var _this = this;
            var changeTracker = this.changeTrackersHash.get(entity);
            if (changeTracker === null) {
                throw new Error("The entity supplied wasn't part of the dataContext.");
            }
            return this.saveEntityDependenciesSequentially(entity).chain(function () {
                return changeTracker.save(_this.service);
            });
        };
        ;
        DataContext.prototype.saveEntity = function (entity) {
            var _this = this;
            var changeTracker = this.changeTrackersHash.get(entity);
            if (changeTracker === null) {
                throw new Error("The entity supplied wasn't part of the dataContext.");
            }
            return this.saveEntityDependencies(entity).chain(function () {
                return changeTracker.save(_this.service);
            });
        };
        ;
        return DataContext;
    })(Observable);
    return DataContext;
});
