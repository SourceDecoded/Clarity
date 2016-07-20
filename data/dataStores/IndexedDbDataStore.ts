import Future = require("../../async/Future");
import Queryable = require("../../query/Queryable");
import Provider = require("../../query/Provider");
import Hashmap = require("../../collections/Hashmap");
import IndexedDbVisitor = require("../../query/IndexedDbVisitor");
import AddedResponse = require("../responses/AddedResponse");
import UpdatedResponse = require("../responses/UpdatedResponse");
import RemovedResponse = require("../responses/RemovedResponse");
import ErrorResponse = require("../responses/ErrorResponse");
import utilsPackage = require("../utils");
import convertToArray = require("../../array/convertToArray");

var convertEntity = utilsPackage.convertDtoToJavascriptEntity;

class IndexedDbDataStore {
    private Type: any;
    private db: any;
    private model: any;
    private edm: any;
    private properties: any;
    private primaryKeys: any[];
    private indexes: any[];
    private mappingTypes: any[];
    private collectionName: string;
    private primaryKeyHash: any;
    private indexHash: any;
    private primaryKeyColumn: any;
    private primitiveTypes: any;
    private flattenEntity: { (entity: any): any };

    private createStore(db) {
        return new Future((setValue, setError) => {
            var config = <any>{};

            if (this.primaryKeys.length === 1) {
                if (this.properties[this.primaryKeys[0]].autoIncrement) {
                    config.autoIncrement = true;
                }
                config.keyPath = this.primaryKeys[0];
            } else {
                var keyPath = this.primaryKeyColumn;
                config.keyPath = keyPath;
            }

            var objectStore = db.createObjectStore(this.model.collectionName, config);

            this.indexes.forEach((key) => {
                if (!this.primaryKeyHash[key]) {
                    objectStore.createIndex(key, key, { unique: false });
                }
            });

            objectStore.transaction.oncomplete = (event) => {
                setValue(undefined);
            };

        });
    };

    private walkExpression(expression, action) {
        if (expression && expression.children) {
            expression.children.forEach((childExpression) => {
                this.walkExpression(childExpression, action);
            });
        }

        action(expression);
    };

    private isAFilterByIndex(expression) {
        var allProperties = [];
        this.walkExpression(expression, (expression) => {
            if (expression.nodeName === "property") {
                allProperties.push(expression.value);
            }
        });


        return allProperties.length === 1 && this.indexHash[allProperties[0]];

    };

    private isAPrimaryKeyFilter(expression) {
        var allProperties = [];
        this.walkExpression(expression, (expression) => {
            if (expression.nodeName === "property") {
                allProperties.push(expression.value);
            }
        });


        return allProperties.length > 0 && allProperties.every((key) => {
            return this.primaryKeyHash[key] ? true : false;
        });
    };

    private getIndexKeyAndValue(expression) {
        var value = <any>{};
        this.walkExpression(expression, (expression) => {
            if (expression.nodeName === "isEqualTo") {
                value.value = expression.children[1].value;
                value.key = expression.children[0].value;
            }
        });

        return value;
    };

    private getPrimaryKey(obj) {
        var keyValue;

        if (this.primaryKeys.length === 1) {
            keyValue = obj[this.primaryKeys[0]];
        } else {
            keyValue = this.primaryKeys.map((key) => {
                return obj[key];
            }).join("_");
        }

        return keyValue;
    };

    private getPrimaryKeyValue(expression) {

        var values = {};
        this.walkExpression(expression, (expression) => {
            if (expression.nodeName === "isEqualTo") {
                values[expression.children[0].value] = expression.children[1].value;
            }
        });

        return this.getPrimaryKey(values);

    };

    constructor(Type, edm) {
        this.db = null;
        this.edm = edm;
        this.model = edm.getModelByType(Type);
        this.properties = this.model.properties;
        this.primaryKeys = edm.getPrimaryKeyProperties(Type);
        this.indexes = edm.getAllKeyProperties(Type);
        this.mappingTypes = edm.getMappingTypes();
        this.collectionName = this.model.collectionName;
        this.primitiveTypes = this.edm.getPrimitiveTypes();

        this.primaryKeyHash = this.primaryKeys.reduce((hash, key) => {
            hash[key] = key;
            return hash;
        }, {});

        this.indexHash = this.indexes.reduce((hash, key) => {
            hash[key] = key;
            return hash;
        }, {});

        this.primaryKeyColumn = this.primaryKeys.join("_");

        this.flattenEntity = (entity) => {
            return Object.keys(this.model.properties).filter(function (propertyName) {
                return this.primitiveTypes.hasKey(this.model.properties[propertyName].type);
            }).reduce(function (updatedEntity, propertyName) {
                updatedEntity[propertyName] = entity[propertyName];
                return updatedEntity;
            }, {});
        };
    }

    add(entity) {
        return new Future((setValue, setError) => {
            var objectStore = this.db.transaction([this.collectionName], "readwrite").objectStore(this.collectionName);
            var storedEntity = this.flattenEntity(entity);

            if (this.primaryKeys.length > 1) {
                // If the key is multi column then we expect the keys to be there.
                var primaryKeyValue = this.getPrimaryKey(entity);
                storedEntity[this.primaryKeyColumn] = primaryKeyValue;
            } else {
                // This is because of we auto increment if we only have one key.
                delete storedEntity[this.primaryKeys[0]];
            }

            var request = objectStore.add(storedEntity);
            request.onsuccess = (event) => {

                if (this.primaryKeys.length === 1) {
                    var keyValue = event.target.result;
                    storedEntity[this.primaryKeys[0]] = keyValue;
                }

                setValue(new AddedResponse("Successfully updated the entity.", storedEntity));

            };

            request.onerror = (event) => {
                setError(new ErrorResponse("Failed to save Entity."));
            };
        }).try();

    };

    update(entity, updates) {
        return new Future((setValue, setError) => {
            var objectStore = this.db.transaction([this.collectionName], "readwrite").objectStore(this.collectionName);
            var updatedEntity = this.flattenEntity(entity);
            var key = this.getPrimaryKey(updatedEntity);

            if (this.primaryKeys.length > 1) {
                updatedEntity[this.primaryKeyColumn] = key;
            }

            if (key === null) {
                throw new Error("Cannot save an entity that doesn't have an key.");
            }

            Object.keys(updates).forEach((key) => {
                updatedEntity[key] = updates[key];
            });

            var updateRequest = objectStore.put(updatedEntity);

            updateRequest.onsuccess = (event) => {
                setValue(new UpdatedResponse("Successfully updated the entity."));
            };

            updateRequest.onerror = () => {
                setError(new ErrorResponse("Failed to save."));
            };

        }).try();
    };

    remove(entity) {
        return new Future((setValue, setError) => {
            var objectStore = this.db.transaction([this.collectionName], "readwrite").objectStore(this.collectionName);
            var key = this.getPrimaryKey(entity);
            var request = objectStore.delete(key);

            request.onsuccess = (event) => {
                setValue(new RemovedResponse("Successfully removed the entity."));
            };

            request.onerror = (event) => {
                setError(new ErrorResponse("Failed to save Entity."));
            };
        }).try();
    };

    asQueryable() {
        var queryable = new Queryable();
        queryable.provider = this.getQueryProvider();
        return queryable;
    };

    getQueryProvider() {
        var provider = (<any>new Provider());
        provider.toArray = provider.execute = (queryable) => {
            return new Future((setValue, setError) => {
                var expression = queryable.getExpression();

                // This checks to see if the entity has multiple columns for a primary key.
                // We have to do a hack for IE, because it doesn't support multi-column key lookups.
                if (this.isAPrimaryKeyFilter(expression)) {
                    var primaryKey = this.getPrimaryKeyValue(expression);
                    var objectStore = this.db.transaction(this.collectionName).objectStore(this.collectionName);
                    var index = objectStore.get(this.primaryKeyColumn);
                    var request = index.get(primaryKey);

                    request.onsuccess = (event) => {
                        setValue([request.result]);
                    };

                    request.onerror = (event) => {
                        setError(event);
                    };

                } else {

                    // This is an optimization.
                    if (this.isAFilterByIndex(expression)) {
                        var indexKeyValue = this.getIndexKeyAndValue(expression);
                        var objectStore = this.db.transaction(this.collectionName).objectStore(this.collectionName);
                        var index = objectStore.get(indexKeyValue.key);
                        var request = index.get(indexKeyValue.value);

                        request.onsuccess = (event) => {
                            setValue([request.result]);
                        };

                        request.onerror = (event) => {
                            setError(event);
                        };

                    } else {

                        // For other queries we need to use the cursor.
                        var objectStore = this.db.transaction(this.collectionName).objectStore(this.collectionName);
                        var request = objectStore.openCursor();
                        var visitor = new IndexedDbVisitor();
                        var expression = queryable.getExpression();
                        var results = [];
                        var skip = 0;
                        var filter = <any>(() => { return true; });
                        var sort;
                        var take;

                        if (expression.where) {
                            filter = visitor.parse(expression.where);
                        }

                        if (expression.orderBy) {
                            sort = visitor.parse(expression.orderBy);
                        }

                        if (expression.take) {
                            take = expression.take.children[0].value;
                        }

                        if (expression.skip) {
                            skip = expression.skip.children[0].value;
                        }

                        request.onsuccess = (event) => {
                            var cursor = event.target.result;

                            if (cursor) {

                                if (filter(cursor.value)) {
                                    results.push(cursor.value);
                                }

                                cursor.continue();
                            } else {

                                if (sort) {
                                    results = results.sort(sort);
                                }

                                if (!take) {
                                    take = undefined;
                                } else {
                                    take = skip + take;
                                }

                                results = results.slice(skip, take);

                                setValue(results.map((item) => {
                                    return convertEntity(this.Type, item);
                                }));

                            }
                        };

                        request.onerror = (event) => {
                            setError(event);
                        };

                    }
                }
            });
        };

        return provider;
    };

    setDatabase(database) {
        this.db = database;
    };

    initialize(db) {
        var collectionNames = convertToArray(db.objectStoreNames);

        if (collectionNames.indexOf(this.collectionName) >= 0) {
            return Future.fromResult(undefined);
        } else {
            return this.createStore(db);
        }
    };

    dispose() {
        // Return a Future.
        throw new Error("This method is expected to be overridden.");
    };
}

export = IndexedDbDataStore;