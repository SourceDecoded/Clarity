import Future = require("../../async/Future");

class CascadeDelete {
    private edm;
    private service;

    constructor(service) {
        this.service = service;
        this.edm = service.getEdm();
    }

    execute(entity) {
                
        // Clean house.
        var cleanTargets = (relationship) => {
            var keyValue = entity[relationship.hasKey];

            if (relationship.optional !== true) {
                return this.service.asQueryable(relationship.ofType).where((e) => {
                    return e.property(relationship.withForeignKey).isEqualTo(keyValue);
                }).toArray().chain((results) => {
                    Future.all(results.map((target) => {
                        return this.service.remove(relationship.ofType, target);
                    }));
                });
            } else {
                return Future.fromResult(undefined);
            }
        };

        var cleanManyToManySources = (relationship) => {
            var keyValue = entity[relationship.hasKey];

            return this.service.asQueryable(relationship.usingMappingType).where((e) => {
                return e.property(relationship.withForeignKey).isEqualTo(keyValue);
            }).forEach((source) => {
                this.service.remove(relationship.usingMappingType, source);
            });

        };

        var cleanManyToManyTargets = (relationship) => {
            var keyValue = entity[relationship.withKey];

            return this.service.asQueryable(relationship.usingMappingType).where(function (e) {
                return e.property(relationship.hasForeignKey).isEqualTo(keyValue);
            }).forEach((target) => {
                this.service.remove(relationship.usingMappingType, target);
            });

        };

        var cleaningFutures = [];

        cleaningFutures = cleaningFutures.concat(this.edm.getOneToOneRelationships(entity).map(cleanTargets));
        cleaningFutures = cleaningFutures.concat(this.edm.getOneToManyRelationships(entity).map(cleanTargets));

        cleaningFutures = cleaningFutures.concat(this.edm.getManyToManyRelationships(entity).map(cleanManyToManySources));
        cleaningFutures = cleaningFutures.concat(this.edm.getManyToManyAsTargetRelationships(entity).map(cleanManyToManyTargets));

        return Future.all(cleaningFutures).try();

    };
}


