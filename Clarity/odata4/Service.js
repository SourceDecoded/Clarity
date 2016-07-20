define(["require", "exports", "../async/Future", "./EndPoint", "../collections/Hashmap", "../query/Provider"], function (require, exports, Future, EndPoint, Hashmap, Provider) {
    var Service = (function () {
        function Service(edm) {
            this.edm = edm;
            this.endPoints = new Hashmap();
            if (this.edm == null) {
                throw new Error("Null Argument Exception: edm has to be defined.");
            }
        }
        Service.prototype.getEndPoint = function (Type) {
            var endPoint = this.endPoints.get(Type);
            if (endPoint === null) {
                throw new Error("Coundn't find endPoint for type: " + Type);
            }
            return endPoint;
        };
        Service.prototype.add = function (Type, entity) {
            var endPoint = this.getEndPoint(Type);
            return endPoint.add(entity);
        };
        Service.prototype.update = function (Type, entity, updates) {
            var endPoint = this.getEndPoint(Type);
            return endPoint.update(entity, updates);
        };
        Service.prototype.remove = function (Type, entity) {
            var endPoint = this.getEndPoint(Type);
            return endPoint.remove(entity);
        };
        Service.prototype.getSourcesOneToOneTargetEntity = function (sourceEntity, relationship) {
            var targetType = relationship.ofType;
            var targetQueryable = this.asQueryable(targetType);
            return targetQueryable.where(function (e) {
                return e.property(relationship.withForeignKey).isEqualTo(sourceEntity[relationship.hasKey]);
            }).firstOrDefault();
        };
        Service.prototype.getTargetsOneToOneSourceEntity = function (targetEntity, relationship) {
            var sourceType = relationship.type;
            var sourceQueryable = this.asQueryable(sourceType);
            return sourceQueryable.where(function (e) {
                return e.property(relationship.hasKey).isEqualTo(targetEntity[relationship.withForeignKey]);
            }).firstOrDefault();
        };
        Service.prototype.getSourcesOneToManyQueryProvider = function (sourceEntity, relationship) {
            var _this = this;
            var provider = new Provider();
            var targetType = relationship.ofType;
            provider.execute = provider.toArray = function (queryable) {
                var targetsQueryable = _this.asQueryable(targetType);
                var targetQueryable = targetsQueryable.where(function (e) {
                    return e.property(relationship.withForeignKey).isEqualTo(sourceEntity[relationship.hasKey]);
                });
                return targetQueryable.merge(queryable).toArray();
            };
            provider.count = function (queryable) {
                var targetsQueryable = _this.asQueryable(targetType);
                var targetQueryable = targetsQueryable.where(function (e) {
                    return e.property(relationship.withForeignKey).isEqualTo(sourceEntity[relationship.hasKey]);
                });
                return targetQueryable.merge(queryable).count();
            };
            return provider;
        };
        Service.prototype.getTargetsOneToManySourceEntity = function (targetEntity, relationship) {
            var sourceType = relationship.type;
            var sourceQueryable = this.asQueryable(sourceType);
            return sourceQueryable.where(function (e) {
                return e.property(relationship.hasKey).isEqualTo(targetEntity[relationship.withForeignKey]);
            }).firstOrDefault();
        };
        Service.prototype.getSourcesManyToManyQueryProvider = function (sourceEntity, relationship) {
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
                    }).toArray();
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
        Service.prototype.getTargetsManyToManyQueryProvider = function (targetEntity, relationship) {
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
                    }).toArray();
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
        Service.prototype.getQueryProvider = function (Type) {
            return this.getEndPoint(Type).getQueryProvider();
        };
        Service.prototype.asQueryable = function (Type) {
            return this.getEndPoint(Type).asQueryable();
        };
        Service.prototype.getEdm = function () {
            return this.edm;
        };
        Service.prototype.supportsType = function (Type) {
            return this.endPoints.hasKey(Type);
        };
        Service.prototype.initialize = function () {
            return Future.fromResult();
        };
        Service.prototype.dispose = function () {
            return Future.fromResult();
        };
        Service.prototype.addEndPoint = function (Type, endPoint) {
            if (!(endPoint instanceof EndPoint)) {
                throw new Error("Invalid Argument Expection: Expected an BASE.odata4.EndPoint.");
            }
            this.endPoints.add(Type, endPoint);
        };
        Service.prototype.invokeClassMethod = function (Type, methodName, parameters, ajaxOptions) {
            var endPoint = this.getEndPoint(Type);
            return endPoint.invokeClassFunction(methodName, parameters, ajaxOptions);
        };
        Service.prototype.invokeInstanceMethod = function (Type, entity, methodName, parameters, ajaxOptions) {
            var endPoint = this.getEndPoint(Type);
            return endPoint.invokeInstanceFunction(methodName, parameters, ajaxOptions);
        };
        Service.prototype.invokeClassMethodWithQueryable = function (Type, methodName, parameters, queryable) {
            var endPoint = this.getEndPoint(Type);
            return endPoint.invokeClassMethodWithQueryable(methodName, parameters, queryable);
        };
        ;
        return Service;
    })();
});
