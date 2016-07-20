import Future = require("../async/Future");
import EndPoint = require("./EndPoint");
import Hashmap = require("../collections/Hashmap");
import Provider = require("../query/Provider");
import convertToODataValue = require("./convertToODataValue");

class Service {
    private endPoints;
    private edm;
    constructor(edm) {
        this.edm = edm;
        this.endPoints = new Hashmap();

        if (this.edm == null) {
            throw new Error("Null Argument Exception: edm has to be defined.");
        }
    }

    getEndPoint(Type) {
        var endPoint = this.endPoints.get(Type);
        if (endPoint === null) {
            throw new Error("Coundn't find endPoint for type: " + Type);
        }

        return endPoint;
    }

    add(Type, entity) {
        var endPoint = this.getEndPoint(Type);
        return endPoint.add(entity);
    }

    update(Type, entity, updates) {
        var endPoint = this.getEndPoint(Type);
        return endPoint.update(entity, updates);
    }

    remove(Type, entity) {
        var endPoint = this.getEndPoint(Type);
        return endPoint.remove(entity);
    }

    getSourcesOneToOneTargetEntity(sourceEntity, relationship) {
        var targetType = relationship.ofType;
        var targetQueryable = this.asQueryable(targetType);

        return targetQueryable.where((e) => {
            return e.property(relationship.withForeignKey).isEqualTo(sourceEntity[relationship.hasKey]);
        }).firstOrDefault();
    }

    getTargetsOneToOneSourceEntity(targetEntity, relationship) {
        var sourceType = relationship.type;
        var sourceQueryable = this.asQueryable(sourceType);

        return sourceQueryable.where((e) => {
            return e.property(relationship.hasKey).isEqualTo(targetEntity[relationship.withForeignKey]);
        }).firstOrDefault();
    }

    getSourcesOneToManyQueryProvider(sourceEntity, relationship) {
        var provider = new Provider();
        var targetType = relationship.ofType;

        provider.execute = provider.toArray = (queryable) => {
            var targetsQueryable = this.asQueryable(targetType);
            var targetQueryable = targetsQueryable.where((e) => {
                return e.property(relationship.withForeignKey).isEqualTo(sourceEntity[relationship.hasKey]);
            });

            return targetQueryable.merge(queryable).toArray();
        };

        provider.count = (queryable) => {
            var targetsQueryable = this.asQueryable(targetType);
            var targetQueryable = targetsQueryable.where((e) => {
                return e.property(relationship.withForeignKey).isEqualTo(sourceEntity[relationship.hasKey]);
            });
            return targetQueryable.merge(queryable).count();
        };

        return provider;
    }

    getTargetsOneToManySourceEntity(targetEntity, relationship) {
        var sourceType = relationship.type;
        var sourceQueryable = this.asQueryable(sourceType);

        return sourceQueryable.where((e) => {
            return e.property(relationship.hasKey).isEqualTo(targetEntity[relationship.withForeignKey]);
        }).firstOrDefault();
    }

    getSourcesManyToManyQueryProvider(sourceEntity, relationship) {
        var provider = new Provider();
        var targetType = relationship.ofType;
        var timestamp = new Date().getTime();
        var mappingDataQueryable = this.asQueryable(relationship.usingMappingType);
        var targetDataQueryable = this.asQueryable(relationship.ofType);

        provider.execute = provider.toArray = (queryable) => {
            return mappingDataQueryable.where((e) => {
                return e.property(relationship.withForeignKey).isEqualTo(sourceEntity[relationship.hasKey]);
            }).toArray().chain((mappingEntities) => {
                return targetDataQueryable.merge(queryable).where((e) => {
                    var ids = [];
                    mappingEntities.forEach((mappingEntity) => {
                        ids.push(e.property(relationship.withKey).isEqualTo(mappingEntity[relationship.hasForeignKey]));
                    });

                    return e.or.apply(e, ids);
                }).toArray();
            });
        };

        provider.count = (queryable) => {
            return mappingDataQueryable.where((e) => {
                return e.property(relationship.withForeignKey).isEqualTo(sourceEntity[relationship.hasKey]);
            }).toArray().chain((mappingEntities) => {
                return targetDataQueryable.merge(queryable).where((e) => {
                    var ids = [];
                    mappingEntities.forEach((mappingEntity) => {
                        ids.push(e.property(relationship.withKey).isEqualTo(mappingEntity[relationship.hasForeignKey]));
                    });

                    return e.or.apply(e, ids);
                }).count();
            });
        };

        return provider;
    }

    getTargetsManyToManyQueryProvider(targetEntity, relationship) {
        var provider = new Provider();
        var sourceType = relationship.type;
        var timestamp = new Date().getTime();
        var mappingDataQueryable = this.asQueryable(relationship.usingMappingType);
        var sourceDataQueryable = this.asQueryable(relationship.type);

        provider.execute = provider.toArray = (queryable) => {

            return mappingDataQueryable.where((e) => {

                return e.property(relationship.hasForeignKey).isEqualTo(targetEntity[relationship.withKey]);

            }).toArray().chain((mappingEntities) => {

                return sourceDataQueryable.merge(queryable).where((e) => {

                    var ids = [];
                    mappingEntities.forEach((mappingEntity) => {
                        ids.push(e.property(relationship.hasKey).isEqualTo(mappingEntity[relationship.withForeignKey]));
                    });

                    return e.or.apply(e, ids);

                }).toArray();
            });

        };

        provider.count = (queryable) => {

            return mappingDataQueryable.where((e) => {

                return e.property(relationship.hasForeignKey).isEqualTo(targetEntity[relationship.withKey]);

            }).toArray().chain((mappingEntities) => {

                return sourceDataQueryable.merge(queryable).where((e) => {

                    var ids = [];
                    mappingEntities.forEach((mappingEntity) => {
                        ids.push(e.property(relationship.hasKey).isEqualTo(mappingEntity[relationship.withForeignKey]));
                    });

                    return e.or.apply(e, ids);

                }).count();
            });
        };

        return provider;
    }

    getQueryProvider(Type) {
        return this.getEndPoint(Type).getQueryProvider();
    }

    asQueryable(Type) {
        return this.getEndPoint(Type).asQueryable();
    }

    getEdm() {
        return this.edm;
    }

    supportsType(Type) {
        return this.endPoints.hasKey(Type);
    }

    initialize() {
        return Future.fromResult();
    }

    dispose() {
        return Future.fromResult();
    }

    addEndPoint(Type, endPoint) {
        if (!(endPoint instanceof EndPoint)) {
            throw new Error("Invalid Argument Expection: Expected an BASE.odata4.EndPoint.");
        }

        this.endPoints.add(Type, endPoint);
    }

    invokeClassMethod(Type, methodName, parameters, ajaxOptions) {
        var endPoint = this.getEndPoint(Type);
        return endPoint.invokeClassFunction(methodName, parameters, ajaxOptions);
    }

    invokeInstanceMethod(Type, entity, methodName, parameters, ajaxOptions) {
        var endPoint = this.getEndPoint(Type);
        return endPoint.invokeInstanceFunction(methodName, parameters, ajaxOptions);
    }

    invokeClassMethodWithQueryable(Type, methodName, parameters, queryable) {
        var endPoint = this.getEndPoint(Type);
        return endPoint.invokeClassMethodWithQueryable(methodName, parameters, queryable);
    };

}

