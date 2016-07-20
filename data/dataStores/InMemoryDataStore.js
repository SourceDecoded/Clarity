var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
define(["require", "exports", "../../async/Future", "../../util/Guid", "../../query/Queryable", "../../query/Provider", "../../collections/Hashmap", "../Edm", "../responses/AddedResponse", "../responses/UpdatedResponse", "../responses/RemovedResponse", "../responses/ErrorResponse", "../../util/Observable", "../utils"], function (require, exports, Future, Guid, Queryable, Provider, Hashmap, EdmPackage, AddedResponse, UpdatedResponse, RemovedResponse, ErrorResponse, Observable, utils) {
    var createGuid = Guid.create;
    var convertDtoToJavascriptEntity = utils.convertDtoToJavascriptEntity;
    var InMemoryDataStore = (function (_super) {
        __extends(InMemoryDataStore, _super);
        function InMemoryDataStore(Type, edm) {
            var _this = this;
            _super.call(this);
            this.dispose = function () {
                return Future.fromResult(undefined);
            };
            this.Type = Type;
            this.edm = edm;
            this.primaryKeyProperties = edm.getPrimaryKeyProperties(Type);
            this.model = edm.getModelByType(Type);
            this.index = 0;
            this.entities = new Hashmap();
            this.provider = new Provider();
            this.provider.execute = this.provider.toArray = function (queryable) {
                return _this.entities.getValues().asQueryable().merge(queryable).toArray().chain(function (results) {
                    return results.map(function (item) { return convertDtoToJavascriptEntity(Type, item); });
                });
            };
            this.provider.count = function (queryable) {
                return _this.entities.getValues().asQueryable().merge(queryable).count();
            };
            if (!Array.isArray(this.primaryKeyProperties) && this.primaryKeyProperties.length > 0) {
                throw new Error("Argument error: primaryKeyProperties needs to be an array of properties.");
            }
        }
        InMemoryDataStore.prototype.createPrimaryKey = function (propertyName) {
            var property = this.model.properties[propertyName];
            if (typeof property === "undefined") {
                throw new Error("Coudn't find property " + propertyName + " in edm.");
            }
            if (property.type === EdmPackage.Integer) {
                return this.index++;
            }
            else if (property.type === String) {
                return createGuid();
            }
            else {
                throw new Error("Primary key can only be a String or a Integer");
            }
        };
        InMemoryDataStore.prototype.setUniqueValues = function (entity) {
            var _this = this;
            this.primaryKeyProperties.forEach(function (key) {
                if (typeof entity[key] === "undefined" || entity[key] === null) {
                    entity[key] = _this.createPrimaryKey(key);
                }
            });
        };
        InMemoryDataStore.prototype.getUniqueValue = function (entity) {
            return this.primaryKeyProperties.reduce(function (current, next) {
                return current += entity[next];
            }, "");
        };
        InMemoryDataStore.prototype.add = function (entity) {
            var result;
            if (!entity) {
                var error = new ErrorResponse("An Entity cannot be null or undefined.");
                result = Future.fromError(error);
            }
            else {
                var id = this.getUniqueValue(entity);
                if (this.entities.hasKey(id)) {
                    var error = new ErrorResponse("An Entity with that key already exists.");
                    result = Future.fromError(error);
                }
                else {
                    var clone = convertDtoToJavascriptEntity(this.Type, entity);
                    this.setUniqueValues(clone);
                    id = this.getUniqueValue(clone);
                    this.entities.add(id, clone);
                    result = Future.fromResult(new AddedResponse("Successfully added enity.", clone));
                    this.notify({
                        type: "added",
                        entity: clone
                    });
                }
            }
            return result;
        };
        InMemoryDataStore.prototype.update = function (entity, updates) {
            var result;
            var id = this.getUniqueValue(entity);
            var inMemoryEntity = this.entities.get(id);
            if (inMemoryEntity) {
                Object.keys(updates).forEach(function (key) {
                    inMemoryEntity[key] = updates[key];
                });
                result = Future.fromResult(new UpdatedResponse("Update was successful."));
                this.notify({
                    type: "updated",
                    id: id,
                    updates: updates
                });
            }
            else {
                result = Future.fromError(new ErrorResponse("Unknown entity, couldn't update."));
            }
            return result;
        };
        InMemoryDataStore.prototype.remove = function (entity) {
            var id = this.getUniqueValue(entity);
            var result;
            var hasKey = this.entities.hasKey(id);
            if (hasKey) {
                this.entities.remove(id);
                result = Future.fromResult(new RemovedResponse("Entity was successfully removed."));
                this.notify({
                    type: "removed",
                    entity: entity
                });
            }
            else {
                result = Future.fromError(new ErrorResponse("Unknown entity, couldn't remove."));
            }
            return result;
        };
        InMemoryDataStore.prototype.asQueryable = function () {
            var queryable = new Queryable(this.Type);
            queryable.provider = this.getQueryProvider();
            return queryable;
        };
        InMemoryDataStore.prototype.getQueryProvider = function () {
            return this.provider;
        };
        InMemoryDataStore.prototype.getEntities = function () {
            return this.entities;
        };
        InMemoryDataStore.prototype.setEntities = function (value) {
            if (value instanceof Hashmap) {
                this.entities = value;
            }
            else {
                throw new Error("Expected a Hashmap.");
            }
        };
        InMemoryDataStore.prototype.initialize = function () {
            return Future.fromResult(undefined);
        };
        return InMemoryDataStore;
    })(Observable);
    return InMemoryDataStore;
});
