import Future = require("../../async/Future");
import Guid = require("../../util/Guid");
import asQueryable = require("../../array/asQueryable");
import Queryable = require("../../query/Queryable");
import Provider = require("../../query/Provider");
import SqlVisitor = require("../../query/SqlVisitor");
import Hashmap = require("../../collections/Hashmap");
import EdmPackage = require("../Edm");
import AddedResponse = require("../responses/AddedResponse");
import UpdatedResponse = require("../responses/UpdatedResponse");
import RemovedResponse = require("../responses/RemovedResponse");
import ErrorResponse = require("../responses/ErrorResponse");
import dateFormat = require("../../date/format");
import Observable = require("../../util/Observable");
import utils = require("../utils");

var createGuid = Guid.create;
var convertDtoToJavascriptEntity = utils.convertDtoToJavascriptEntity;

class InMemoryDataStore extends Observable {
    private Type;
    private edm;
    private primaryKeyProperties;
    private model;
    private index;
    private entities;
    private provider;

    private createPrimaryKey(propertyName): any {
        var property = this.model.properties[propertyName];

        if (typeof property === "undefined") {
            throw new Error("Coudn't find property " + propertyName + " in edm.");
        }

        if (property.type === EdmPackage.Integer) {
            return this.index++;
        } else if (property.type === String) {
            return createGuid();
        } else {
            throw new Error("Primary key can only be a String or a Integer");
        }
    }

    private setUniqueValues(entity) {
        this.primaryKeyProperties.forEach((key) => {
            if (typeof entity[key] === "undefined" || entity[key] === null) {
                entity[key] = this.createPrimaryKey(key);
            }
        });
    }

    private getUniqueValue(entity) {
        return this.primaryKeyProperties.reduce((current, next) => {
            return current += entity[next];
        }, "");
    }

    constructor(Type, edm) {
        super();
        this.Type = Type;
        this.edm = edm;
        this.primaryKeyProperties = edm.getPrimaryKeyProperties(Type);
        this.model = edm.getModelByType(Type);
        this.index = 0;
        this.entities = new Hashmap();
        this.provider = <any>new Provider();

        this.provider.execute = this.provider.toArray = (queryable) => {
            return this.entities.getValues().asQueryable().merge(queryable).toArray().chain((results) => {
                return results.map((item) => { return convertDtoToJavascriptEntity(Type, item); });
            });
        };

        this.provider.count = (queryable) => {
            return this.entities.getValues().asQueryable().merge(queryable).count();
        };

        if (!Array.isArray(this.primaryKeyProperties) && this.primaryKeyProperties.length > 0) {
            throw new Error("Argument error: primaryKeyProperties needs to be an array of properties.");
        }
    }

    add(entity) {
        var result;
        if (!entity) {
            var error = new ErrorResponse("An Entity cannot be null or undefined.");
            result = Future.fromError(error);
        } else {
            var id = this.getUniqueValue(entity);

            if (this.entities.hasKey(id)) {
                var error = new ErrorResponse("An Entity with that key already exists.");
                result = Future.fromError(error);
            } else {
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
    }

    update(entity, updates) {
        var result;
        var id = this.getUniqueValue(entity);

        var inMemoryEntity = this.entities.get(id);

        if (inMemoryEntity) {
            Object.keys(updates).forEach((key) => {
                inMemoryEntity[key] = updates[key];
            });

            result = Future.fromResult(new UpdatedResponse("Update was successful."));

            this.notify({
                type: "updated",
                id: id,
                updates: updates
            });

        } else {
            result = Future.fromError(new ErrorResponse("Unknown entity, couldn't update."));
        }

        return result;
    }

    remove(entity) {
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

        } else {
            result = Future.fromError(new ErrorResponse("Unknown entity, couldn't remove."));
        }

        return result;
    }

    asQueryable() {
        var queryable = new Queryable(this.Type);
        queryable.provider = this.getQueryProvider();

        return queryable;
    }

    getQueryProvider() {
        return this.provider;
    }

    getEntities() {
        return this.entities;
    }

    setEntities(value) {
        if (value instanceof Hashmap) {
            this.entities = value;
        } else {
            throw new Error("Expected a Hashmap.");
        }
    }

    initialize() {
        return Future.fromResult(undefined);
    }

    dispose = function () {
        return Future.fromResult(undefined);
    }
}

export = InMemoryDataStore;