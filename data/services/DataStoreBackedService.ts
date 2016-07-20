import Future = require("../../async/Future");
import Hashmap = require("../../collections/Hashmap");
import Queryable = require("../../query/Queryable");
import intersect = require("../../array/intersect");
import converToArray = require("../../array/convertToArray");
import Provider = require("../../query/Provider");
import IncludeVisitor = require("../../query/IncludeVisitor");

class DataStoreBackedService {
    private readyFuture: Future<any>;
    private hooks: Hashmap;
    private transactionsServicesByName: any;
    private getHookByType(Type) {
        var hook = this.hooks.get(Type);
        if (hook === null) {
            hook = [];
            this.hooks.add(Type, hook);
        }

        return hook;
    }

    getDataStore;
    edm;

    private addHook(Type, hook) {
        var hooks = this.getHookByType(Type);

        hooks.push(hook);
    }

    private removeHook(Type, hook) {
        var hooks = this.getHookByType(Type);
        var index = hooks.indexOf(hook);

        if (index >= 0) {
            hooks.splice(index, 1);
        }
        hooks.push(hook);
    }

    constructor(config: { edm: any, getDataStore: (Type: any) => void, readyFuture: Future<any> }) {
        this.edm = config.edm;
        this.getDataStore = config.getDataStore || function () { return null; };
        this.readyFuture = config.readyFuture || Future.fromResult(undefined);
        this.hooks = new Hashmap();
        this.transactionsServicesByName = {};

        if (typeof this.edm === "undefined") {
            throw new Error("BASE.data.services.DataStoreBackedService needs to have an edm in the config object.");
        }

        if (typeof this.getDataStore !== "function") {
            throw new Error("The config needs to have a getDataStore function.");
        }

    }


    executeHooks(Type, actionType, args) {
        var typeHooks = this.hooks.get(Type)
        if (typeHooks !== null) {
            var hooksResults = typeHooks.map((hook) => {
                var action = hook.actions[actionType];

                if (typeof action === "function") {
                    return action(args);
                } else {
                    return Future.fromResult(undefined);
                }
            });

            Future.all(hooksResults);

        } else {
            return Future.fromResult(undefined);
        }
    };

    add(Type, entity) {
        var dataStore = this.getDataStore(Type);
        var timestamp = new Date().getTime();

        return dataStore.add(entity).chain((response) => {
            return this.executeHooks(Type, "added", [response.entity, timestamp]).chain(() => {
                return response;
            });
        });
    };

    update(Type, entity, updates) {
        var dataStore = this.getDataStore(Type);
        var timestamp = new Date().getTime();

        return dataStore.update(entity, updates).chain((response) => {
            return this.executeHooks(Type, "updated", [entity, updates, timestamp]).chain(() => {
                return response;
            });
        });
    };

    remove(Type, entity) {
        var dataStore = this.getDataStore(Type);
        var timestamp = new Date().getTime();

        return dataStore.remove(entity).chain((response) => {
            return this.executeHooks(Type, "removed", [entity, timestamp]).chain(() => {
                return response;
            });
        });
    };

    getSourcesOneToOneTargetEntity(sourceEntity, relationship) {
        var targetType = relationship.ofType;
        var targetQueryable = this.asQueryable(targetType);
        var timestamp = new Date().getTime();

        return targetQueryable.where((e) => {
            return e.property(relationship.withForeignKey).isEqualTo(sourceEntity[relationship.hasKey]);
        }).firstOrDefault().chain((entity) => {
            return this.executeHooks(targetType, "queried", [[entity], timestamp]).chain(() => {
                return entity;
            });
        });
    };

    getTargetsOneToOneSourceEntity(targetEntity, relationship) {
        var sourceType = relationship.type;
        var sourceQueryable = this.asQueryable(sourceType);
        var timestamp = new Date().getTime();

        return sourceQueryable.where((e) => {
            return e.property(relationship.hasKey).isEqualTo(targetEntity[relationship.withForeignKey]);
        }).firstOrDefault().chain((entity) => {
            return this.executeHooks(sourceType, "queried", [[entity], timestamp]).chain(() => {
                return entity;
            });
        });
    };

    getSourcesOneToManyQueryProvider(sourceEntity, relationship) {
        var provider = new Provider();
        var targetType = relationship.ofType;
        var timestamp = new Date().getTime();

        var targetsQueryable = this.asQueryable(relationship.ofType);
        var targetQueryable = targetsQueryable.where((e) => {
            return e.property(relationship.withForeignKey).isEqualTo(sourceEntity[relationship.hasKey]);
        });

        provider.execute = provider.toArray = (queryable) => {
            return targetQueryable.merge(queryable).toArray().chain((entities) => {
                return this.executeHooks(targetType, "queried", [entities, timestamp]).chain(() => {
                    return entities;
                });
            });
        };

        provider.count = (queryable) => {
            return targetQueryable.merge(queryable).count().chain((entities) => {
                return this.executeHooks(targetType, "queried", [entities, timestamp]).chain(() => {
                    return entities;
                });
            });
        };

        return provider;
    };

    getTargetsOneToManySourceEntity(targetEntity, relationship) {
        var sourceType = relationship.type;
        var sourceQueryable = this.asQueryable(sourceType);
        var timestamp = new Date().getTime();

        return sourceQueryable.where((e) => {
            return e.property(relationship.hasKey).isEqualTo(targetEntity[relationship.withForeignKey]);
        }).firstOrDefault().chain((entity) => {
            return this.executeHooks(sourceType, "queried", [[entity], timestamp]).chain(() => {
                return entity;
            });
        });
    };

    getSourcesManyToManyQueryProvider(sourceEntity, relationship) {
        var provider = new Provider();
        var targetType = relationship.ofType;
        var timestamp = new Date().getTime();
        var mappingDataQueryable = this.asQueryable(relationship.usingMappingType);
        var targetDataQueryable = this.asQueryable(relationship.ofType);

        provider.execute = provider.toArray = function (queryable) {
            return mappingDataQueryable.where(function (e) {
                return e.property(relationship.withForeignKey).isEqualTo(sourceEntity[relationship.hasKey])
            }).toArray().chain(function (mappingEntities) {
                if (mappingEntities.length > 0) {
                    return targetDataQueryable.merge(queryable).where(function (e) {
                        var ids = [];
                        mappingEntities.forEach(function (mappingEntity) {
                            ids.push(e.property(relationship.withKey).isEqualTo(mappingEntity[relationship.hasForeignKey]));
                        });

                        return e.or.apply(e, ids);
                    }).toArray().chain(function (entities) {
                        return this.executeHooks(targetType, "queried", [entities, timestamp]).chain(function () {
                            return entities;
                        });
                    });
                }

                return [];
            });
        };

        provider.count = function (queryable) {
            return mappingDataQueryable.where(function (e) {
                return e.property(relationship.withForeignKey).isEqualTo(sourceEntity[relationship.hasKey]);
            }).toArray().chain(function (mappingEntities) {
                return targetDataQueryable.merge(queryable).where(function (e) {
                    var ids = [];
                    mappingEntities.forEach(function (mappingEntity) {
                        ids.push(e.property(relationship.withKey).isEqualTo(mappingEntity[relationship.hasForeignKey]));
                    });

                    return e.or.apply(e, ids);
                }).count();
            });
        };

        return provider;
    };

    getTargetsManyToManyQueryProvider(targetEntity, relationship) {
        var provider = new Provider();
        var sourceType = relationship.type;
        var timestamp = new Date().getTime();
        var mappingDataQueryable = this.asQueryable(relationship.usingMappingType);
        var sourceDataQueryable = this.asQueryable(relationship.type);

        provider.execute = provider.toArray = function (queryable) {
            return mappingDataQueryable.where(function (e) {
                return e.property(relationship.hasForeignKey).isEqualTo(targetEntity[relationship.withKey])
            }).toArray().chain(function (mappingEntities) {
                if (mappingEntities.length > 0) {
                    return sourceDataQueryable.merge(queryable).where(function (e) {
                        var ids = [];
                        mappingEntities.forEach(function (mappingEntity) {
                            ids.push(e.property(relationship.hasKey).isEqualTo(mappingEntity[relationship.withForeignKey]));
                        });

                        return e.or.apply(e, ids);
                    }).toArray().chain(function (entities) {
                        return this.executeHooks(sourceType, "queried", [entities, timestamp]).chain(function () {
                            return entities;
                        });
                    });
                }
                return [];
            });

        };

        provider.count = function (queryable) {
            return mappingDataQueryable.where(function (e) {
                return e.property(relationship.hasForeignKey).isEqualTo(targetEntity[relationship.withKey]);
            }).toArray().chain(function (mappingEntities) {
                return sourceDataQueryable.merge(queryable).where(function (e) {
                    var ids = [];
                    mappingEntities.forEach(function (mappingEntity) {
                        ids.push(e.property(relationship.hasKey).isEqualTo(mappingEntity[relationship.withForeignKey]));
                    });

                    return e.or.apply(e, ids);
                }).count();
            });
        };

        return provider;
    };

    getQueryProvider(Type) {
        var dataStore = this.getDataStore(Type);
        var timestamp = new Date().getTime();
        var dataStoreProvider = dataStore.getQueryProvider();
        var provider = new Provider();

        provider.execute = provider.toArray = (queryable) => {
            return dataStoreProvider.execute(queryable).chain((results) => {
                return this.executeHooks(Type, "queried", [results, timestamp]).chain(() => {
                    var parameters = queryable.getExpression().parameters;
                    var includeVisitor = new IncludeVisitor(Type, results, self, parameters);
                    var expression = queryable.getExpression();
                    var includeExpression = expression.include;

                    return includeVisitor.parse(includeExpression).then(() => {
                        return results;
                    });
                });
            });

        };

        provider.count = dataStoreProvider.count;
        return provider;
    };

    asQueryable(Type) {
        var queryable = new Queryable(Type);
        queryable.provider = this.getQueryProvider(Type);

        return queryable;
    };

    getEdm() {
        return this.edm;
    };

    supportsType(Type) {
        var dataStore = this.getDataStore(Type);
        return dataStore === null || typeof dataStore === "undefined" ? true : false;
    };

    addTransactionService(name, service) {
        this.transactionsServicesByName[name] = service;
    };

    getTransactionService(name) {
        var service = this.transactionsServicesByName[name];
        return service ? service : null;
    };

    // The actions should be an object with the methods it wants to hook on to.
    // {queried: function(entities){}, added: function(entity){}, updated: function(entity){}, removed: function(entity){}}
    createHook(Type, actions) {

        var hook = {
            actions: actions,
            dispose: function () {
                this.removeHook(Type, hook);
            }
        };

        this.addHook(Type, hook);
    };

    initialize() {
        return this.readyFuture;
    };

    dispose() {
        return Future.fromResult(null);
    };
}

export = DataStoreBackedService;