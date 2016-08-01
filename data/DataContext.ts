import Future = require("../async/Future");
import asQueryable = require("../array/asQueryable");
import ChangeTracker = require("./ChangeTracker");
import Orm = require("./Orm");
import DataSet = require("./DataSet");
import Entity = require("./Entity");
import Hashmap = require("../collections/Hashmap");
import MultiKeyMap = require("../collections/MultiKeyMap");
import Provider = require("../query/Provider");
import Queryable = require("../query/Queryable");
import Observable = require("../util/Observable");
import EntityNotFoundErrorResponse = require("./responses/EntityNotFoundErrorResponse");
import ArrayProvider = require("../query/ArrayProvider");
import orderBy = require("../Array/orderBy");

var emptyFuture = Future.fromResult(undefined);
var emptyQueryable = (<any>[]).asQueryable();

var flattenMultiKeyMap = function (multiKeyMap) {
    var keys = multiKeyMap.getKeys();
    return keys.reduce(function (array, key) {
        return array.concat(multiKeyMap.get(key).getValues());
    }, []);
}

class DataContext extends Observable {
    service;
    edm;
    orm;
    changeTrackersHash;
    loadedBucket;
    addedBucket;
    updatedBucket;
    removedBucket;
    sequenceBucket;
    transactionId;
    mappingTypes;

    private removeEntityFromChangeTrackerBuckets(entity) {
        this.addedBucket.remove(entity.constructor, entity);
        this.updatedBucket.remove(entity.constructor, entity);
        this.removedBucket.remove(entity.constructor, entity);

        var index = this.sequenceBucket.indexOf(entity);
        if (index >= 0) {
            this.sequenceBucket.splice(index, 1);
        }
    }

    private saveEntityDependenciesSequentially(entity) {
        var oneToOne = this.edm.getOneToOneAsTargetRelationships(entity);
        var oneToMany = this.edm.getOneToManyAsTargetRelationships(entity);
        var dependencies = oneToOne.concat(oneToMany);

        return dependencies.filter((relationship) => {
            return !relationship.optional;
        }).reduce((future, relationship) => {
            var property = relationship.withOne;
            var source = entity[property];
            if (source) {
                return future.chain(() => {
                    return this.saveEntitySequentially(source);
                });
            }
            return future;
        }, emptyFuture);
    };

    private saveEntityDependencies(entity) {
        var oneToOne = this.edm.getOneToOneAsTargetRelationships(entity);
        var oneToMany = this.edm.getOneToManyAsTargetRelationships(entity);
        var dependencies = oneToOne.concat(oneToMany);

        return Future.all(dependencies.filter((relationship) => {
            return !relationship.optional;
        }).map((relationship) => {
            var property = relationship.withOne;
            var source = entity[property];
            if (source) {
                return this.saveEntity(source);
            }
            return emptyFuture;
        }));
    }

    private createSourcesOneToOneProvider(entity, relationship) {
        if (typeof relationship.hasOne !== "undefined") {

            entity.registerProvider(relationship.hasOne, (entity) => {

                return this.service.getSourcesOneToOneTargetEntity(entity, relationship).chain((target) => {

                    if (target !== null) {
                        var loadedTarget = this.loadEntityByType(relationship.ofType, target);
                        return loadedTarget;
                    } else {
                        return target;
                    }

                })["catch"]((error) => {

                    if (error instanceof EntityNotFoundErrorResponse) {
                        return null;
                    } else {
                        return Future.fromError(error);
                    }

                });
            });
        }
    }

    private createTargetsOneToOneProvider(entity, relationship) {
        if (typeof relationship.withOne !== "undefined") {

            entity.registerProvider(relationship.withOne, (entity) => {

                return this.service.getTargetsOneToOneSourceEntity(entity, relationship).chain((source) => {

                    if (source !== null) {
                        var loadedSource = this.loadEntityByType(relationship.type, source);
                        return loadedSource;
                    } else {
                        return source;
                    }

                }).chain((error) => {

                    if (error instanceof EntityNotFoundErrorResponse) {
                        return null;
                    } else {
                        return Future.fromError(error);
                    }

                });

            });
        }
    }

    private createTargetsOneToManyProvider(entity, relationship) {
        if (typeof relationship.withOne !== "undefined") {

            entity.registerProvider(relationship.withOne, (entity) => {

                return this.service.getTargetsOneToManySourceEntity(entity, relationship).chain((source) => {

                    if (source !== null) {
                        var loadedSource = this.loadEntityByType(relationship.type, source);
                        return loadedSource;
                    } else {
                        return source;
                    }

                });

            });
        }
    }

    private createOneToManyProvider(entity, fillArray, relationship) {
        var provider = new Provider();
        var sourcesProvider = this.service.getSourcesOneToManyQueryProvider(entity, relationship);

        provider.toArray = provider.execute = (queryable) => {
            var queryableCopy = queryable.copy();
            queryableCopy.provider = sourcesProvider;

            if (provider === null) {
                throw new Error("Couldn't find a provider for type.");
            }

            return queryableCopy.toArray().chain((dtos) => {
                var entities = this.loadEntities(relationship.ofType, dtos);

                entities.forEach((entity) => {
                    if (fillArray.indexOf(entity) === -1) {
                        fillArray.load(entity);
                    }
                });

                return entities;
            });

        };

        provider.count = sourcesProvider.count;

        return provider;
    }

    private createManyToManyProvider(entity, fillArray, relationship) {
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

    }

    private createManyToManyAsTargetProvider(entity, fillArray, relationship) {
        var provider = <any>new Provider();
        var targetsProvider = this.service.getTargetsManyToManyQueryProvider(entity, relationship);

        provider.toArray = provider.execute = (queryable) => {
            var provider = targetsProvider;
            var queryableCopy = queryable.copy();
            queryableCopy.provider = provider;

            if (provider === null) {
                throw new Error("Couldn't find provider for type.");
            }

            queryableCopy.toArray().chain((dtos) => {
                var entities = this.loadEntities(relationship.type, dtos);

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

    }

    private addOneToOneProviders(entity) {
        var oneToOneRelationships = this.edm.getOneToOneRelationships(entity);
        var oneToOneAsTargetsRelationships = this.edm.getOneToOneAsTargetRelationships(entity);

        oneToOneRelationships.forEach((relationship) => {
            this.createSourcesOneToOneProvider(entity, relationship);
        });

        oneToOneAsTargetsRelationships.forEach((relationship) => {
            this.createTargetsOneToOneProvider(entity, relationship);
        });
    }

    private addOneToManyProviders(entity) {
        var oneToManyRelationships = this.edm.getOneToManyRelationships(entity);
        var oneToManyAsTargetsRelationships = this.edm.getOneToManyAsTargetRelationships(entity);

        oneToManyRelationships.forEach((relationship) => {
            var property = relationship.hasMany;
            if (typeof property !== "undefined") {

                var provider = this.createOneToManyProvider(entity, entity[property], relationship);

                entity[property].getProvider = () => { return provider; };
            }
        });

        oneToManyAsTargetsRelationships.forEach((relationship) => {
            this.createTargetsOneToManyProvider(entity, relationship);
        });
    }

    private addManyToManyProviders(entity) {
        var sourceRelationships = this.edm.getManyToManyRelationships(entity);
        var targetRelationships = this.edm.getManyToManyAsTargetRelationships(entity);

        sourceRelationships.forEach((relationship) => {
            var property = relationship.hasMany;
            if (typeof property !== "undefined") {
                var provider = this.createManyToManyProvider(entity, entity[property], relationship);

                entity[property].getProvider = () => { return provider; };
            }
        });

        targetRelationships.forEach((relationship) => {
            var property = relationship.withMany;
            if (typeof property !== "undefined") {
                var provider = this.createManyToManyAsTargetProvider(entity, entity[property], relationship);

                entity[property].getProvider = () => { return provider; };
            }
        });
    }

    private removeOneToOneProviders(entity) {
        var oneToOneRelationships = this.edm.getOneToOneRelationships(entity);
        var oneToOneAsTargetsRelationships = this.edm.getOneToOneAsTargetRelationships(entity);

        oneToOneRelationships.forEach((relationship) => {
            entity.unregisterProvider(relationship.hasOne);
        });

        oneToOneAsTargetsRelationships.forEach((relationship) => {
            entity.unregisterProvider(relationship.withOne);
        });
    }

    private removeOneToManyProviders(entity) {
        var oneToManyRelationships = this.edm.getOneToManyRelationships(entity);

        oneToManyRelationships.forEach(function (relationship) {
            var array = entity[relationship.hasMany];
            var provider = new ArrayProvider(array);
            array.getProvider = function () {
                return provider;
            };
        });
    }

    private removeManyToManyProviders(entity) {
        var sourceRelationships = this.edm.getManyToManyRelationships(entity);
        var targetRelationships = this.edm.getManyToManyAsTargetRelationships(entity);

        sourceRelationships.forEach((relationship) => {
            var array = entity[relationship.hasMany];
            var provider = new ArrayProvider(array);
            array.getProvider = () => {
                return provider;
            };
        });

        targetRelationships.forEach((relationship) => {
            var array = entity[relationship.withMany];
            var provider = new ArrayProvider(array);
            array.getProvider = function () {
                return provider;
            };
        });
    };


    private getUniqueValue(entity) {
        var uniqueKey = {};
        var properties = this.edm.getPrimaryKeyProperties(entity.constructor);

        properties.forEach((key) => {
            uniqueKey[key] = entity[key];
        });

        return JSON.stringify(uniqueKey);
    };

    private hasAllPrimaryKeys(entity) {
        var properties = this.edm.getPrimaryKeyProperties(entity.constructor);

        return properties.every((key) => {
            return entity[key] !== null;
        });
    };

    private addRelationshipProviders(entity) {
        this.addOneToOneProviders(entity);
        this.addOneToManyProviders(entity);
        this.addManyToManyProviders(entity);
    };

    private removeRelationshipProviders(entity) {
        this.removeOneToOneProviders(entity);
        this.removeOneToManyProviders(entity);
        this.removeManyToManyProviders(entity);
    };

    private ormAttachEntity(entity) {
        var Type = entity.constructor;
        var loadedEntity = this.loadedBucket.get(Type, this.getUniqueValue(entity));

        if (loadedEntity === entity) {
            return;
        }

        if (loadedEntity !== null) {
            throw new Error("Entity was already attached to dataContext as a different entity.");
        }

        Object.keys(entity).forEach((key) => {
            var value = entity[key];
            if (typeof value === "object" && value !== null) {
                if (Array.isArray(value)) {
                    value.forEach((childEntity) => {
                        this.ormAttachEntity(childEntity);
                    });
                } else {
                    this.ormAttachEntity(value);
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

    loadEntityByType(Type, dto) {
        var entity = this.loadedBucket.get(Type, this.getUniqueValue(dto));
        var model = this.edm.getModelByType(Type);
        var primitives = this.edm.getPrimitiveTypes();

        if (entity === null) {
            entity = new Type();

            var complexKeys = Object.keys(model.properties).filter(function (key) {
                var property = model.properties[key];
                var value = dto[key];

                var isPrimitive = primitives.hasKey(property.type);
                if (isPrimitive) {
                    entity[key] = value;
                }

                return !isPrimitive;
            });

            this.loadedBucket.add(Type, this.getUniqueValue(entity), entity);

            complexKeys.forEach(function (key) {
                var value = dto[key];
                if (typeof value === "object" && value !== null) {
                    if (Array.isArray(value)) {
                        value.forEach(function (childEntity) {
                            var Type = childEntity.constructor;
                            childEntity = this.loadEntityByType(Type, childEntity);
                            var index = entity[key].indexOf(childEntity);

                            if (index === -1) {
                                entity[key].push(childEntity);
                            }

                        });
                    } else if (this.edm.getModelByType(value.constructor) !== null) {
                        var Type = value.constructor;
                        entity[key] = this.loadEntityByType(Type, value);
                    } else {
                        entity[key] = value;
                    }
                }
            });

            this.addEntity(entity);

            this.notify({
                type: "loaded",
                Type: entity.constructor,
                entity: entity
            });
        } else if (this.changeTrackersHash.get(entity)) {
            this.syncEntity(entity, dto);
        }

        return entity;
    }

    loadEntities(Type, dtos) {
        var entities = [];
        dtos.forEach((dto) => {
            entities.push(this.loadEntityByType(Type, dto));
        });

        return entities;
    };

    getTransactionService(name) {
        var transactionService = null;
        if (typeof this.service.getTransactionService === "function") {
            transactionService = this.service.getTransactionService(name);
        }
        return transactionService;
    };

    saveChangesWithTransaction(transactionService, name) {
        var savingEntityFutures = [];
        var mappingEntities = [];
        var entitiesToSave = this.sequenceBucket.slice(0);

        this.transactionId++;
        transactionService.startTransaction(this.transactionId);

        entitiesToSave.forEach(function (entity) {
            if (this.mappingTypes.hasKey(entity.constructor)) {
                mappingEntities.push(entity);
            } else {
                var changeTracker = this.changeTrackersHash.get(entity);
                savingEntityFutures.push(changeTracker.save(transactionService));
            }
        });

        mappingEntities.forEach(function (entity) {
            savingEntityFutures.push(this.saveEntity(entity));
        });

        transactionService.endTransaction(this.transactionId);
        return Future.all(savingEntityFutures);
    };

    saveChanges(name) {
        var transactionService = this.getTransactionService(name);
        var resultFutures;

        if (typeof name === "string" && transactionService === null) {
            throw new Error("Cannot find service for transaction.");
        }

        if (transactionService != null) {
            return this.saveChangesWithTransaction(transactionService, name);
        }

        var entitiesToSave = this.sequenceBucket.slice(0).reduce(function (buckets, entity) {
            if (this.mappingTypes.hasKey(entity.constructor)) {
                buckets.mapping.push(entity);
            } else {
                buckets.normal.push(entity);
            }
            return buckets;
        }, {
                normal: [],
                mapping: []
            });

        return Future.all(entitiesToSave.normal.map(function (entity) {
            return this.saveEntityDependencies(entity);
        })).chain(function () {

            resultFutures = entitiesToSave.normal.map(function (entity) {
                var changeTracker = this.changeTrackersHash.get(entity);
                return changeTracker.save(this.service);
            });

            return Future.all(resultFutures);
        }).chain(function (resultFutures) {

            var mappingEntityFutures = entitiesToSave.mapping.map(function (entity) {
                var changeTracker = this.changeTrackersHash.get(entity);
                var future = changeTracker.save(this.service);
                resultFutures.push(future);

                return future;
            });

            return Future.all(mappingEntityFutures);

        }).chain(function () {
            return resultFutures;
        });

    }

    loadEntity(entity) {
        return this.loadEntityByType(entity.constructor, entity);
    }

    attachEntity = function (entity) {
        this.orm.attach(entity);
    }

    addEntity(entity) {
        this.orm.add(entity);
    }

    removeEntity(entity) {
        this.orm.remove(entity);
    }

    detachEntity(entity) {
        var changeTracker = this.changeTrackersHash.get(entity);
        if (changeTracker != null) {
            this.orm.detach(entity);
        }
    }

    syncEntity(entity, dto) {
        var changeTracker = this.changeTrackersHash.get(entity);
        if (changeTracker !== null) {
            changeTracker.sync(dto);
        } else {
            throw new Error("Entity isn't part of the data context.");
        }
    };

    saveChangesAsync(name) {
        return this.saveChanges(name).chain(function (futures) {

            var saveChangesResult = futures.reduce(function (saveChangesResult, future) {
                if (future.error !== null) {
                    saveChangesResult.errorResponses.push(future.error);
                    saveChangesResult.responses.push(future.error);
                } else {
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
                saveChangesResult.toString = function () { return "Successfully saved." };
                return Future.fromResult(saveChangesResult);
            } else {

                var message;
                var errorCount = saveChangesResult.errorResponses.length;
                if (errorCount > 1) {
                    message = errorCount + " errors occurred while saving to database.";
                } else {
                    message = "An error occurred while saving to database.";
                }

                saveChangesResult.toString = function () { return message; };
                return Future.fromError(saveChangesResult);
            }
        });
    };

    saveChangesSequentially() {
        var savedEntityFutures = [];
        var mappingTypes = this.edm.getMappingTypes();
        var entitiesToSave = this.sequenceBucket.slice(0);

        // Put the mapping entities to the back.
        entitiesToSave.orderBy((entity) => {
            if (mappingTypes.hasKey(entity.constructor)) {
                return 1;
            } else {
                return 0;
            }
        });

        return entitiesToSave.reduce((future, entity) => {
            return future.chain(() => {
                return this.saveEntityDependenciesSequentially(entity);
            }).chain(() => {
                var changeTracker = this.changeTrackersHash.get(entity);
                var savingFuture = changeTracker.save(this.service);
                savedEntityFutures.push(savingFuture);
                return savingFuture;
            });
        }, emptyFuture);
    };

    asQueryableLocal(Type) {
        var bucket = this.loadedBucket.get(Type);
        if (bucket !== null) {
            return bucket.getValues().asQueryable();
        } else {
            return emptyQueryable;
        }
    };

    asQueryable(Type) {
        var queryable = new Queryable(Type);

        var provider = this.getQueryProvider(Type);
        queryable.provider = provider;

        return queryable;
    };

    getQueryProvider(Type) {
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

    getOrm() {
        return this.orm;
    };

    getPendingEntities() {
        return {
            added: flattenMultiKeyMap(this.addedBucket),
            removed: flattenMultiKeyMap(this.removedBucket),
            updated: flattenMultiKeyMap(this.updatedBucket)
        };
    };

    getLoadedEntities() {
        return this.loadedBucket.copy();
    };

    dispose() {
        this.changeTrackersHash.getKeys().forEach((entity) => {
            this.detachEntity(entity);
        })
    };

    // Removes all entities from the buckets.
    // The entities that are in the added state will be detached.
    // All the other entities will be set back to loaded.
    purgeChangeTracker() {
        var buckets = this.getPendingEntities();
        var setToLoaded = (entityData) => {
            var changeTracker = this.changeTrackersHash.get(entityData.entity);
            changeTracker.setStateToLoaded();
        }

        buckets.added.forEach((entityData) => {
            var changeTracker = this.changeTrackersHash.get(entityData.entity);
            changeTracker.setStateToDetached();
        });

        buckets.updated.forEach(setToLoaded);
        buckets.removed.forEach(setToLoaded);
    };

    getService() {
        return this.service;
    };



    setUpChangeTracker(entity) {
        if (entity.__dataContext__ != null && entity.__dataContext__ !== self) {
            throw new Error("Entity cannot be part of two contexts.");
        }

        entity.__dataContext__ = self;

        // As requested by Ben
        entity.save = () => {
            return this.saveEntity(entity);
        };

        this.addRelationshipProviders(entity);

        var changeTracker = new ChangeTracker(entity, this.service);

        changeTracker.observeType("detached", () => {
            this.loadedBucket.remove(entity.constructor, this.getUniqueValue(entity));
            this.addedBucket.remove(entity.constructor, entity);
            this.updatedBucket.remove(entity.constructor, entity);
            this.removedBucket.remove(entity.constructor, entity);
            this.changeTrackersHash.remove(entity);
            this.removeRelationshipProviders(entity);
            entity.__dataContext__ = null;
        });

        changeTracker.observeType("added", () => {
            this.removeEntityFromChangeTrackerBuckets(entity);
            this.addedBucket.add(entity.constructor, entity, {
                entity: entity,
                timestamp: performance.now()
            });
            this.sequenceBucket.push(entity);
        });

        changeTracker.observeType("updated", () => {
            this.removeEntityFromChangeTrackerBuckets(entity);
            this.updatedBucket.add(entity.constructor, entity, {
                entity: entity,
                timestamp: performance.now()
            });
            this.sequenceBucket.push(entity);
        });

        changeTracker.observeType("removed", () => {
            this.removeEntityFromChangeTrackerBuckets(entity);
            this.removedBucket.add(entity.constructor, entity, {
                entity: entity,
                timestamp: performance.now()
            });
            this.sequenceBucket.push(entity);
        });

        changeTracker.observeType("loaded", () => {
            this.removeEntityFromChangeTrackerBuckets(entity);

            // We want to use the entity's key as the key for the hash, so we can sync.
            this.loadedBucket.add(entity.constructor, this.getUniqueValue(entity), entity);
        });

        this.changeTrackersHash.add(entity, changeTracker);
        return changeTracker;
    };


    constructor(service) {
        super();
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
        this.mappingTypes = this.edm.getMappingTypes();

        // Add DataSets
        this.edm.getModels().getValues().forEach((model) => {
            if (model.collectionName) {
                this[model.collectionName] = new DataSet(model.type, self);
            }
        });

        this.orm.observeType("entityAdded", (e) => {
            var entity = e.entity;
            Entity.apply(entity);

            var changeTracker = this.setUpChangeTracker(entity);

            if (this.hasAllPrimaryKeys(entity) && !this.mappingTypes.hasKey(entity.constructor)) {
                changeTracker.setStateToLoaded();
            } else {
                changeTracker.add();

                this.notify({
                    type: "added",
                    Type: entity.constructor,
                    entity: entity
                });
            }
        });

        this.orm.observeType("entityRemoved", (e) => {
            var entity = e.entity;
            var changeTracker = this.changeTrackersHash.get(entity);

            // This only happens with Many to Many.
            // I really don't like this. Its a broken pattern. I've missed something somewhere.
            if (!changeTracker) {
                changeTracker = this.setUpChangeTracker(entity);
                changeTracker.setStateToLoaded();
            }

            changeTracker.remove();

            this.notify({
                type: "removed",
                Type: entity.constructor,
                entity: entity
            });
        });

        this.orm.observeType("entityDetached", (e) => {
            var entity = e.entity;
            var changeTracker = this.changeTrackersHash.remove(entity);

            if (!changeTracker) {
                return;
            }

            entity.__dataContext__ = null;

            changeTracker.detach();

            this.notify({
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

    saveEntitySequentially(entity) {
        var changeTracker = this.changeTrackersHash.get(entity);

        if (changeTracker === null) {
            throw new Error("The entity supplied wasn't part of the dataContext.");
        }

        return this.saveEntityDependenciesSequentially(entity).chain(() => {
            return changeTracker.save(this.service);
        });
    };

    saveEntity(entity) {
        var changeTracker = this.changeTrackersHash.get(entity);

        if (changeTracker === null) {
            throw new Error("The entity supplied wasn't part of the dataContext.");
        }

        return this.saveEntityDependencies(entity).chain(() => {
            return changeTracker.save(this.service);
        });
    };
}

export = DataContext;

