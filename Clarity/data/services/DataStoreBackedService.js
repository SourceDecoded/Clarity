define(["require", "exports", "../../async/Future", "../../collections/Hashmap", "../../query/Queryable", "../../query/Provider", "../../query/IncludeVisitor"], function (require, exports, Future, Hashmap, Queryable, Provider, IncludeVisitor) {
    var DataStoreBackedService = (function () {
        function DataStoreBackedService(config) {
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
        DataStoreBackedService.prototype.getHookByType = function (Type) {
            var hook = this.hooks.get(Type);
            if (hook === null) {
                hook = [];
                this.hooks.add(Type, hook);
            }
            return hook;
        };
        DataStoreBackedService.prototype.addHook = function (Type, hook) {
            var hooks = this.getHookByType(Type);
            hooks.push(hook);
        };
        DataStoreBackedService.prototype.removeHook = function (Type, hook) {
            var hooks = this.getHookByType(Type);
            var index = hooks.indexOf(hook);
            if (index >= 0) {
                hooks.splice(index, 1);
            }
            hooks.push(hook);
        };
        DataStoreBackedService.prototype.executeHooks = function (Type, actionType, args) {
            var typeHooks = this.hooks.get(Type);
            if (typeHooks !== null) {
                var hooksResults = typeHooks.map(function (hook) {
                    var action = hook.actions[actionType];
                    if (typeof action === "function") {
                        return action(args);
                    }
                    else {
                        return Future.fromResult(undefined);
                    }
                });
                Future.all(hooksResults);
            }
            else {
                return Future.fromResult(undefined);
            }
        };
        ;
        DataStoreBackedService.prototype.add = function (Type, entity) {
            var _this = this;
            var dataStore = this.getDataStore(Type);
            var timestamp = new Date().getTime();
            return dataStore.add(entity).chain(function (response) {
                return _this.executeHooks(Type, "added", [response.entity, timestamp]).chain(function () {
                    return response;
                });
            });
        };
        ;
        DataStoreBackedService.prototype.update = function (Type, entity, updates) {
            var _this = this;
            var dataStore = this.getDataStore(Type);
            var timestamp = new Date().getTime();
            return dataStore.update(entity, updates).chain(function (response) {
                return _this.executeHooks(Type, "updated", [entity, updates, timestamp]).chain(function () {
                    return response;
                });
            });
        };
        ;
        DataStoreBackedService.prototype.remove = function (Type, entity) {
            var _this = this;
            var dataStore = this.getDataStore(Type);
            var timestamp = new Date().getTime();
            return dataStore.remove(entity).chain(function (response) {
                return _this.executeHooks(Type, "removed", [entity, timestamp]).chain(function () {
                    return response;
                });
            });
        };
        ;
        DataStoreBackedService.prototype.getSourcesOneToOneTargetEntity = function (sourceEntity, relationship) {
            var _this = this;
            var targetType = relationship.ofType;
            var targetQueryable = this.asQueryable(targetType);
            var timestamp = new Date().getTime();
            return targetQueryable.where(function (e) {
                return e.property(relationship.withForeignKey).isEqualTo(sourceEntity[relationship.hasKey]);
            }).firstOrDefault().chain(function (entity) {
                return _this.executeHooks(targetType, "queried", [[entity], timestamp]).chain(function () {
                    return entity;
                });
            });
        };
        ;
        DataStoreBackedService.prototype.getTargetsOneToOneSourceEntity = function (targetEntity, relationship) {
            var _this = this;
            var sourceType = relationship.type;
            var sourceQueryable = this.asQueryable(sourceType);
            var timestamp = new Date().getTime();
            return sourceQueryable.where(function (e) {
                return e.property(relationship.hasKey).isEqualTo(targetEntity[relationship.withForeignKey]);
            }).firstOrDefault().chain(function (entity) {
                return _this.executeHooks(sourceType, "queried", [[entity], timestamp]).chain(function () {
                    return entity;
                });
            });
        };
        ;
        DataStoreBackedService.prototype.getSourcesOneToManyQueryProvider = function (sourceEntity, relationship) {
            var _this = this;
            var provider = new Provider();
            var targetType = relationship.ofType;
            var timestamp = new Date().getTime();
            var targetsQueryable = this.asQueryable(relationship.ofType);
            var targetQueryable = targetsQueryable.where(function (e) {
                return e.property(relationship.withForeignKey).isEqualTo(sourceEntity[relationship.hasKey]);
            });
            provider.execute = provider.toArray = function (queryable) {
                return targetQueryable.merge(queryable).toArray().chain(function (entities) {
                    return _this.executeHooks(targetType, "queried", [entities, timestamp]).chain(function () {
                        return entities;
                    });
                });
            };
            provider.count = function (queryable) {
                return targetQueryable.merge(queryable).count().chain(function (entities) {
                    return _this.executeHooks(targetType, "queried", [entities, timestamp]).chain(function () {
                        return entities;
                    });
                });
            };
            return provider;
        };
        ;
        DataStoreBackedService.prototype.getTargetsOneToManySourceEntity = function (targetEntity, relationship) {
            var _this = this;
            var sourceType = relationship.type;
            var sourceQueryable = this.asQueryable(sourceType);
            var timestamp = new Date().getTime();
            return sourceQueryable.where(function (e) {
                return e.property(relationship.hasKey).isEqualTo(targetEntity[relationship.withForeignKey]);
            }).firstOrDefault().chain(function (entity) {
                return _this.executeHooks(sourceType, "queried", [[entity], timestamp]).chain(function () {
                    return entity;
                });
            });
        };
        ;
        DataStoreBackedService.prototype.getSourcesManyToManyQueryProvider = function (sourceEntity, relationship) {
            var _this = this;
            var provider = new Provider();
            var targetType = relationship.ofType;
            var timestamp = new Date().getTime();
            var mappingDataQueryable = this.asQueryable(relationship.usingMappingType);
            var targetDataQueryable = this.asQueryable(relationship.ofType);
            provider.execute = provider.toArray = function (queryable) {
                return mappingDataQueryable.where(function (e) {
                    return e.property(relationship.withForeignKey).isEqualTo(sourceEntity[relationship.hasKey]);
                }).toArray().chain(function (mappingEntities) {
                    return targetDataQueryable.merge(queryable).where(function (e) {
                        var ids = [];
                        mappingEntities.forEach(function (mappingEntity) {
                            ids.push(e.property(relationship.withKey).isEqualTo(mappingEntity[relationship.hasForeignKey]));
                        });
                        return e.or.apply(e, ids);
                    }).toArray().chain(function (entities) {
                        return _this.executeHooks(targetType, "queried", [entities, timestamp]).chain(function () {
                            return entities;
                        });
                    });
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
        ;
        DataStoreBackedService.prototype.getTargetsManyToManyQueryProvider = function (targetEntity, relationship) {
            var _this = this;
            var provider = new Provider();
            var sourceType = relationship.type;
            var timestamp = new Date().getTime();
            var mappingDataQueryable = this.asQueryable(relationship.usingMappingType);
            var sourceDataQueryable = this.asQueryable(relationship.type);
            provider.execute = provider.toArray = function (queryable) {
                return mappingDataQueryable.where(function (e) {
                    return e.property(relationship.hasForeignKey).isEqualTo(targetEntity[relationship.withKey]);
                }).toArray().chain(function (mappingEntities) {
                    return sourceDataQueryable.merge(queryable).where(function (e) {
                        var ids = [];
                        mappingEntities.forEach(function (mappingEntity) {
                            ids.push(e.property(relationship.hasKey).isEqualTo(mappingEntity[relationship.withForeignKey]));
                        });
                        return e.or.apply(e, ids);
                    }).toArray().chain(function (entities) {
                        return _this.executeHooks(sourceType, "queried", [entities, timestamp]).chain(function () {
                            return entities;
                        });
                    });
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
        ;
        DataStoreBackedService.prototype.getQueryProvider = function (Type) {
            var _this = this;
            var dataStore = this.getDataStore(Type);
            var timestamp = new Date().getTime();
            var dataStoreProvider = dataStore.getQueryProvider();
            var provider = new Provider();
            provider.execute = provider.toArray = function (queryable) {
                return dataStoreProvider.execute(queryable).chain(function (results) {
                    return _this.executeHooks(Type, "queried", [results, timestamp]).chain(function () {
                        var parameters = queryable.getExpression().parameters;
                        var includeVisitor = new IncludeVisitor(Type, results, self, parameters);
                        var expression = queryable.getExpression();
                        var includeExpression = expression.include;
                        return includeVisitor.parse(includeExpression).then(function () {
                            return results;
                        });
                    });
                });
            };
            provider.count = dataStoreProvider.count;
            return provider;
        };
        ;
        DataStoreBackedService.prototype.asQueryable = function (Type) {
            var queryable = new Queryable(Type);
            queryable.provider = this.getQueryProvider(Type);
            return queryable;
        };
        ;
        DataStoreBackedService.prototype.getEdm = function () {
            return this.edm;
        };
        ;
        DataStoreBackedService.prototype.supportsType = function (Type) {
            var dataStore = this.getDataStore(Type);
            return dataStore === null || typeof dataStore === "undefined" ? true : false;
        };
        ;
        DataStoreBackedService.prototype.addTransactionService = function (name, service) {
            this.transactionsServicesByName[name] = service;
        };
        ;
        DataStoreBackedService.prototype.getTransactionService = function (name) {
            var service = this.transactionsServicesByName[name];
            return service ? service : null;
        };
        ;
        // The actions should be an object with the methods it wants to hook on to.
        // {queried: function(entities){}, added: function(entity){}, updated: function(entity){}, removed: function(entity){}}
        DataStoreBackedService.prototype.createHook = function (Type, actions) {
            var hook = {
                actions: actions,
                dispose: function () {
                    this.removeHook(Type, hook);
                }
            };
            this.addHook(Type, hook);
        };
        ;
        DataStoreBackedService.prototype.initialize = function () {
            return this.readyFuture;
        };
        ;
        DataStoreBackedService.prototype.dispose = function () {
            return Future.fromResult(null);
        };
        ;
        return DataStoreBackedService;
    })();
    return DataStoreBackedService;
});
