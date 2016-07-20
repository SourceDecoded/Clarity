define(["require", "exports", "../../async/Future"], function (require, exports, Future) {
    var CascadeDelete = (function () {
        function CascadeDelete(service) {
            this.service = service;
            this.edm = service.getEdm();
        }
        CascadeDelete.prototype.execute = function (entity) {
            var _this = this;
            // Clean house.
            var cleanTargets = function (relationship) {
                var keyValue = entity[relationship.hasKey];
                if (relationship.optional !== true) {
                    return _this.service.asQueryable(relationship.ofType).where(function (e) {
                        return e.property(relationship.withForeignKey).isEqualTo(keyValue);
                    }).toArray().chain(function (results) {
                        Future.all(results.map(function (target) {
                            return _this.service.remove(relationship.ofType, target);
                        }));
                    });
                }
                else {
                    return Future.fromResult(undefined);
                }
            };
            var cleanManyToManySources = function (relationship) {
                var keyValue = entity[relationship.hasKey];
                return _this.service.asQueryable(relationship.usingMappingType).where(function (e) {
                    return e.property(relationship.withForeignKey).isEqualTo(keyValue);
                }).forEach(function (source) {
                    _this.service.remove(relationship.usingMappingType, source);
                });
            };
            var cleanManyToManyTargets = function (relationship) {
                var keyValue = entity[relationship.withKey];
                return _this.service.asQueryable(relationship.usingMappingType).where(function (e) {
                    return e.property(relationship.hasForeignKey).isEqualTo(keyValue);
                }).forEach(function (target) {
                    _this.service.remove(relationship.usingMappingType, target);
                });
            };
            var cleaningFutures = [];
            cleaningFutures = cleaningFutures.concat(this.edm.getOneToOneRelationships(entity).map(cleanTargets));
            cleaningFutures = cleaningFutures.concat(this.edm.getOneToManyRelationships(entity).map(cleanTargets));
            cleaningFutures = cleaningFutures.concat(this.edm.getManyToManyRelationships(entity).map(cleanManyToManySources));
            cleaningFutures = cleaningFutures.concat(this.edm.getManyToManyAsTargetRelationships(entity).map(cleanManyToManyTargets));
            return Future.all(cleaningFutures).try();
        };
        ;
        return CascadeDelete;
    })();
});
