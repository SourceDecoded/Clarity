define(["require", "exports", "../../async/Future", "../../query/Queryable", "../../query/Provider", "../../query/IndexedDbVisitor", "../responses/AddedResponse", "../responses/UpdatedResponse", "../responses/RemovedResponse", "../responses/ErrorResponse", "../utils", "../../array/convertToArray"], function (require, exports, Future, Queryable, Provider, IndexedDbVisitor, AddedResponse, UpdatedResponse, RemovedResponse, ErrorResponse, utilsPackage, convertToArray) {
    var flattenEntity = utilsPackage.flattenEntity;
    var convertEntity = utilsPackage.convertDtoToJavascriptEntity;
    var IndexedDbDataStore = (function () {
        function IndexedDbDataStore(Type, edm) {
            this.db = null;
            this.model = edm.getModelByType(Type);
            this.properties = this.model.properties;
            this.primaryKeys = edm.getPrimaryKeyProperties(Type);
            this.indexes = edm.getAllKeyProperties(Type);
            this.mappingTypes = edm.getMappingTypes();
            this.collectionName = this.model.collectionName;
            this.primaryKeyHash = this.primaryKeys.reduce(function (hash, key) {
                hash[key] = key;
                return hash;
            }, {});
            this.indexHash = this.indexes.reduce(function (hash, key) {
                hash[key] = key;
                return hash;
            }, {});
            this.primaryKeyColumn = this.primaryKeys.join("_");
        }
        IndexedDbDataStore.prototype.createStore = function (db) {
            var _this = this;
            return new Future(function (setValue, setError) {
                var config = {};
                if (_this.primaryKeys.length === 1) {
                    if (_this.properties[_this.primaryKeys[0]].autoIncrement) {
                        config.autoIncrement = true;
                    }
                    config.keyPath = _this.primaryKeys[0];
                }
                else {
                    var keyPath = _this.primaryKeyColumn;
                    config.keyPath = keyPath;
                }
                var objectStore = db.createObjectStore(_this.model.collectionName, config);
                _this.indexes.forEach(function (key) {
                    if (!_this.primaryKeyHash[key]) {
                        objectStore.createIndex(key, key, { unique: false });
                    }
                });
                objectStore.transaction.oncomplete = function (event) {
                    setValue(undefined);
                };
            });
        };
        ;
        IndexedDbDataStore.prototype.walkExpression = function (expression, action) {
            var _this = this;
            if (expression && expression.children) {
                expression.children.forEach(function (childExpression) {
                    _this.walkExpression(childExpression, action);
                });
            }
            action(expression);
        };
        ;
        IndexedDbDataStore.prototype.isAFilterByIndex = function (expression) {
            var allProperties = [];
            this.walkExpression(expression, function (expression) {
                if (expression.nodeName === "property") {
                    allProperties.push(expression.value);
                }
            });
            return allProperties.length === 1 && this.indexHash[allProperties[0]];
        };
        ;
        IndexedDbDataStore.prototype.isAPrimaryKeyFilter = function (expression) {
            var _this = this;
            var allProperties = [];
            this.walkExpression(expression, function (expression) {
                if (expression.nodeName === "property") {
                    allProperties.push(expression.value);
                }
            });
            return allProperties.length > 0 && allProperties.every(function (key) {
                return _this.primaryKeyHash[key] ? true : false;
            });
        };
        ;
        IndexedDbDataStore.prototype.getIndexKeyAndValue = function (expression) {
            var value = {};
            this.walkExpression(expression, function (expression) {
                if (expression.nodeName === "isEqualTo") {
                    value.value = expression.children[1].value;
                    value.key = expression.children[0].value;
                }
            });
            return value;
        };
        ;
        IndexedDbDataStore.prototype.getPrimaryKey = function (obj) {
            var keyValue;
            if (this.primaryKeys.length === 1) {
                keyValue = obj[this.primaryKeys[0]];
            }
            else {
                keyValue = this.primaryKeys.map(function (key) {
                    return obj[key];
                }).join("_");
            }
            return keyValue;
        };
        ;
        IndexedDbDataStore.prototype.getPrimaryKeyValue = function (expression) {
            var values = {};
            this.walkExpression(expression, function (expression) {
                if (expression.nodeName === "isEqualTo") {
                    values[expression.children[0].value] = expression.children[1].value;
                }
            });
            return this.getPrimaryKey(values);
        };
        ;
        IndexedDbDataStore.prototype.add = function (entity) {
            var _this = this;
            return new Future(function (setValue, setError) {
                var objectStore = _this.db.transaction([_this.collectionName], "readwrite").objectStore(_this.collectionName);
                var storedEntity = flattenEntity(entity);
                if (_this.primaryKeys.length > 1) {
                    // If the key is multi column then we expect the keys to be there.
                    var primaryKeyValue = _this.getPrimaryKey(entity);
                    storedEntity[_this.primaryKeyColumn] = _this.primaryKeyColumn;
                }
                else {
                    // This is because of we auto increment if we only have one key.
                    delete storedEntity[_this.primaryKeys[0]];
                }
                var request = objectStore.add(storedEntity);
                request.onsuccess = function (event) {
                    if (_this.primaryKeys.length === 1) {
                        var keyValue = event.target.result;
                        storedEntity[_this.primaryKeys[0]] = keyValue;
                    }
                    setValue(new AddedResponse("Successfully updated the entity.", storedEntity));
                };
                request.onerror = function (event) {
                    setError(new ErrorResponse("Failed to save Entity."));
                };
            }).try();
        };
        ;
        IndexedDbDataStore.prototype.update = function (entity, updates) {
            var _this = this;
            return new Future(function (setValue, setError) {
                var objectStore = _this.db.transaction([_this.collectionName], "readwrite").objectStore(_this.collectionName);
                var updatedEntity = flattenEntity(entity);
                var key = _this.getPrimaryKey(updatedEntity);
                if (_this.primaryKeys.length > 1) {
                    updatedEntity[_this.primaryKeyColumn] = key;
                }
                if (key === null) {
                    throw new Error("Cannot save an entity that doesn't have an key.");
                }
                Object.keys(updates).forEach(function (key) {
                    updatedEntity[key] = updates[key];
                });
                var updateRequest = objectStore.put(updatedEntity);
                updateRequest.onsuccess = function (event) {
                    setValue(new UpdatedResponse("Successfully updated the entity."));
                };
                updateRequest.onerror = function () {
                    setError(new ErrorResponse("Failed to save."));
                };
            }).try();
        };
        ;
        IndexedDbDataStore.prototype.remove = function (entity) {
            var _this = this;
            return new Future(function (setValue, setError) {
                var objectStore = _this.db.transaction([_this.collectionName], "readwrite").objectStore(_this.collectionName);
                var key = _this.getPrimaryKey(entity);
                var request = objectStore.delete(key);
                request.onsuccess = function (event) {
                    setValue(new RemovedResponse("Successfully removed the entity."));
                };
                request.onerror = function (event) {
                    setError(new ErrorResponse("Failed to save Entity."));
                };
            }).try();
        };
        ;
        IndexedDbDataStore.prototype.asQueryable = function () {
            var queryable = new Queryable();
            queryable.provider = this.getQueryProvider();
            return queryable;
        };
        ;
        IndexedDbDataStore.prototype.getQueryProvider = function () {
            var _this = this;
            var provider = (new Provider());
            provider.toArray = provider.execute = function (queryable) {
                return new Future(function (setValue, setError) {
                    var expression = queryable.getExpression();
                    // This checks to see if the entity has multiple columns for a primary key.
                    // We have to do a hack for IE, because it doesn't support multi-column key lookups.
                    if (_this.isAPrimaryKeyFilter(expression)) {
                        var primaryKey = _this.getPrimaryKeyValue(expression);
                        var objectStore = _this.db.transaction(_this.collectionName).objectStore(_this.collectionName);
                        var index = objectStore.get(_this.primaryKeyColumn);
                        var request = index.get(primaryKey);
                        request.onsuccess = function (event) {
                            setValue([request.result]);
                        };
                        request.onerror = function (event) {
                            setError(event);
                        };
                    }
                    else {
                        // This is an optimization.
                        if (_this.isAFilterByIndex(expression)) {
                            var indexKeyValue = _this.getIndexKeyAndValue(expression);
                            var objectStore = _this.db.transaction(_this.collectionName).objectStore(_this.collectionName);
                            var index = objectStore.get(indexKeyValue.key);
                            var request = index.get(indexKeyValue.value);
                            request.onsuccess = function (event) {
                                setValue([request.result]);
                            };
                            request.onerror = function (event) {
                                setError(event);
                            };
                        }
                        else {
                            // For other queries we need to use the cursor.
                            var objectStore = _this.db.transaction(_this.collectionName).objectStore(_this.collectionName);
                            var request = objectStore.openCursor();
                            var visitor = new IndexedDbVisitor();
                            var expression = queryable.getExpression();
                            var results = [];
                            var skip = 0;
                            var filter = (function () { return true; });
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
                            request.onsuccess = function (event) {
                                var cursor = event.target.result;
                                if (cursor) {
                                    if (filter(cursor.value)) {
                                        results.push(cursor.value);
                                    }
                                    cursor.continue();
                                }
                                else {
                                    if (sort) {
                                        results = results.sort();
                                    }
                                    if (!take) {
                                        take = undefined;
                                    }
                                    else {
                                        take = skip + take;
                                    }
                                    results = results.slice(skip, take);
                                    setValue(results.map(function (item) {
                                        return convertEntity(_this.Type, item);
                                    }));
                                }
                            };
                            request.onerror = function (event) {
                                setError(event);
                            };
                        }
                    }
                });
            };
            return provider;
        };
        ;
        IndexedDbDataStore.prototype.setDatabase = function (database) {
            this.db = database;
        };
        ;
        IndexedDbDataStore.prototype.initialize = function (db) {
            var collectionNames = convertToArray(db.objectStoreNames);
            if (collectionNames.indexOf(this.collectionName) >= 0) {
                return Future.fromResult(undefined);
            }
            else {
                return this.createStore(db);
            }
        };
        ;
        IndexedDbDataStore.prototype.dispose = function () {
            // Return a Future.
            throw new Error("This method is expected to be overridden.");
        };
        ;
        return IndexedDbDataStore;
    })();
    return IndexedDbDataStore;
});
