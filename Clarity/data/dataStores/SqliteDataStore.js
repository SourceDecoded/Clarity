define(["require", "exports", "../../async/Future", "../../query/Queryable", "../../query/Provider", "../../query/SqlVisitor", "../../collections/Hashmap", "../Edm", "../responses/AddedResponse", "../responses/UpdatedResponse", "../responses/RemovedResponse", "../responses/ErrorResponse", "../utils"], function (require, exports, Future, Queryable, Provider, SqlVisitor, Hashmap, EdmPackage, AddedResponse, UpdatedResponse, RemovedResponse, ErrorResponse, utils) {
    var flattenEntity = utils.flattenEntity;
    var sqlizePrimitive = function (value) {
        if (typeof value === "string") {
            return value;
        }
        else if (typeof value === "number") {
            return value.toString();
        }
        else if (typeof value === "boolean") {
            return value ? 1 : 0;
        }
        else if (value instanceof Date) {
            return value.getTime();
        }
        else if (value === null) {
            return null;
        }
    };
    var typesMap = new Hashmap();
    typesMap.add(EdmPackage.Double, "REAL");
    typesMap.add(EdmPackage.Float, "REAL");
    typesMap.add(EdmPackage.Integer, "INTEGER");
    typesMap.add(EdmPackage.Byte, "INTEGER");
    typesMap.add(EdmPackage.Binary, "INTEGER");
    typesMap.add(Boolean, "NUMERIC");
    typesMap.add(Date, "NUMERIC");
    typesMap.add(EdmPackage.DateTimeOffset, "NUMERIC");
    typesMap.add(EdmPackage.Decimal, "NUMERIC");
    typesMap.add(EdmPackage.Enum, "NUMERIC");
    typesMap.add(String, "TEXT");
    var filterReleventProperties = function (properties) {
        return Object.keys(properties).filter(function (key) {
            var property = properties[key];
            if (typeof property.type !== "undefined") {
                return typesMap.hasKey(property.type);
            }
            return false;
        });
    };
    var findPrimaryKeys = function (properties) {
        return filterReleventProperties(properties).filter(function (key) {
            if (properties[key].primaryKeyRelationships.length > 0) {
                return true;
            }
            return false;
        });
    };
    var getDefaultValue = function (model, property) {
        var defaultValue = null;
        var getter = model.properties[property].defaultValue;
        if (typeof getter === "function") {
            defaultValue = getter();
        }
        else if (typeof getter !== "undefined") {
            defaultValue = getter;
        }
        return defaultValue;
    };
    var SqlWriter = (function () {
        function SqlWriter(edm) {
        }
        SqlWriter.prototype.createTableClause = function (model) {
            return "CREATE TABLE " + model.collectionName + this.createColumnDefinition(model);
        };
        SqlWriter.prototype.createColumnDefinition = function (model) {
            var _this = this;
            var foreignKeys = [];
            var columns = [];
            var indexes = new Hashmap();
            var primaryKeys = [];
            var properties = model.properties;
            Object.keys(properties).forEach(function (property) {
                if (properties[property].primaryKey) {
                    primaryKeys.push(property);
                }
            });
            Object.keys(model.properties).forEach(function (key) {
                var property = model.properties[key];
                if (typeof property.type !== "undefined") {
                    var sqlType = typesMap.get(property.type);
                    var primaryKey = "";
                    if (sqlType !== null) {
                        if (property.primaryKey) {
                            indexes.add(key, key);
                            if (primaryKeys.length === 1) {
                                primaryKey = " PRIMARY KEY";
                            }
                            if (property.autoIncrement) {
                                primaryKey += " AUTOINCREMENT";
                            }
                        }
                        columns.push(key + " " + sqlType + primaryKey);
                    }
                    if (property.foreignKeyRelationship) {
                        indexes.add(property.foreignKeyRelationship.withForeignKey, property.foreignKeyRelationship.withForeignKey);
                        var sourceModel = _this.edm.getModelByType(property.foreignKeyRelationship.type);
                        foreignKeys.push("FOREIGN KEY (" + property.foreignKeyRelationship.withForeignKey + ") REFERENCES " + sourceModel.collectionName + "(" + property.foreignKeyRelationship.hasKey + ")");
                    }
                }
            });
            var primaryKeysStatement = "";
            if (primaryKeys.length > 1) {
                primaryKeysStatement = ", PRIMARY KEY (" + primaryKeys.join(", ") + ")";
            }
            var indexValues = indexes.getValues();
            var definition = "(\n\t";
            definition += columns.concat(foreignKeys).join(", \n\t");
            definition += primaryKeysStatement;
            definition += "\n)";
            return definition;
        };
        ;
        SqlWriter.prototype.createIndexes = function (model) {
            var indexes = new Hashmap();
            Object.keys(model.properties).forEach(function (key) {
                var property = model.properties[key];
                if (typeof property.type !== "undefined") {
                    var sqlType = typesMap.get(property.type);
                    if (sqlType !== null) {
                        if (property.primaryKeyRelationships.length > 0 || property.primaryKey) {
                            indexes.add(key, key);
                        }
                    }
                    if (property.foreignKeyRelationship) {
                        indexes.add(property.foreignKeyRelationship.withForeignKey, property.foreignKeyRelationship.withForeignKey);
                    }
                }
            });
            var indexValues = indexes.getValues();
            var definition = "CREATE INDEX IF NOT EXISTS " + indexValues.join("_") + " ON " + model.collectionName + " (\n\t" + indexValues.join(", \n\t") + "\n)";
            return definition;
        };
        ;
        SqlWriter.prototype.createInsertStatement = function (entity) {
            var Type = entity.constructor;
            var model = this.edm.getModelByType(Type);
            var columns = [];
            var values = [];
            var properties = model.properties;
            filterReleventProperties(properties).forEach(function (key) {
                var defaultValue = getDefaultValue(model, key);
                if (typeof entity[key] !== "undefined" && entity[key] !== null) {
                    columns.push(key);
                    if (entity[key] === null) {
                        values.push(sqlizePrimitive(defaultValue));
                    }
                    else {
                        values.push(sqlizePrimitive(entity[key]));
                    }
                }
            });
            if (values.length === 0) {
                return {
                    statement: "INSERT INTO " + model.collectionName + " DEFAULT VALUES",
                    values: values
                };
            }
            else {
                return {
                    statement: "INSERT INTO " + model.collectionName + " (" + columns.join(", ") + ") VALUES (" + values.map(function () { return "?"; }).join(", ") + ")",
                    values: values
                };
            }
        };
        ;
        SqlWriter.prototype.createUpdateStatement = function (entity, updates) {
            var model = this.edm.getModelByType(entity.constructor);
            var primaryKeyExpr = [];
            var primaryKeyValues = [];
            var columnSet = [];
            var values = [];
            var properties = model.properties;
            Object.keys(properties).forEach(function (key) {
                var property = properties[key];
                if (typeof updates[key] !== "undefined" && typesMap.hasKey(property.type)) {
                    columnSet.push(key + " = ?");
                    values.push(sqlizePrimitive(updates[key]));
                }
            });
            filterReleventProperties(properties).forEach(function (key) {
                if (properties[key].primaryKeyRelationships.length !== 0 || properties[key].primaryKey) {
                    primaryKeyExpr.push(key + " = ?");
                    primaryKeyValues.push(entity[key]);
                }
            });
            values = values.concat(primaryKeyValues);
            return {
                statement: "UPDATE " + model.collectionName + " SET " + columnSet.join(", ") + " WHERE " + primaryKeyExpr.join(" AND "),
                values: values
            };
        };
        ;
        SqlWriter.prototype.createDeleteStatement = function (entity) {
            var model = this.edm.getModelByType(entity.constructor);
            var primaryKeysExpr = [];
            var values = [];
            var properties = model.properties;
            var primaryKeys = this.edm.getPrimaryKeyProperties(entity.constructor);
            primaryKeys.forEach(function (primaryKey) {
                if (entity[primaryKey] === null) {
                    primaryKeysExpr.push(primaryKey + " IS NULL");
                }
                else {
                    primaryKeysExpr.push(primaryKey + " = ?");
                    values.push(sqlizePrimitive(entity[primaryKey]));
                }
            });
            return {
                statement: "DELETE FROM " + model.collectionName + " WHERE " + primaryKeysExpr.join(" AND "),
                values: values
            };
        };
        ;
        return SqlWriter;
    })();
    ;
    var SqliteDataStore = (function () {
        function SqliteDataStore(Type, db, edm) {
            var _this = this;
            this.Type = Type;
            this.db = db;
            this.edm = edm;
            this.edmModel = edm.getModelByType(Type);
            this.properties = this.edmModel.properties;
            this.tableName = this.edmModel.collectionName;
            this.sqlWriter = new SqlWriter(edm);
            this.tableSql = this.sqlWriter.createTableClause(this.edmModel);
            this.indexesSql = this.sqlWriter.createIndexes(this.edmModel);
            this.primaryKeys = findPrimaryKeys(this.edmModel.properties);
            this.primaryKey = this.primaryKeys[0];
            this.readyFuture = this.execute("SELECT sql FROM sqlite_master WHERE tbl_name = '" + this.tableName + "'").chain(function (results) {
                if (results.rows.length > 0) {
                    var oldTableSql = results.rows.item(0).sql;
                    if (oldTableSql !== _this.tableSql) {
                        return _this.execute("DROP TABLE IF EXISTS " + _this.tableName);
                    }
                }
                return Future.fromResult(undefined);
            }).chain(function () {
                return _this.createTable();
            }).catch(function (e) {
                console.log(e.message, _this.tableSql);
                return new Error("Unknown Error");
            }).try();
        }
        SqliteDataStore.prototype.createTable = function () {
            var _this = this;
            return this.execute(this.tableSql).chain(function () {
                return _this.execute(_this.indexesSql);
            });
        };
        SqliteDataStore.prototype.execute = function (sql, values) {
            var _this = this;
            if (!Array.isArray(values)) {
                values = [];
            }
            return new Future(function (setValue, setError) {
                _this.db.transaction(function (transaction) {
                    transaction.executeSql(sql, values, function (transaction, results) {
                        setValue(results);
                    }, function (transaction, error) {
                        setError(error);
                    });
                });
            }).try();
        };
        SqliteDataStore.prototype.add = function (entity) {
            var _this = this;
            var relationships = this.edm.getOneToOneAsTargetRelationships(entity);
            relationships = relationships.concat(this.edm.getOneToManyAsTargetRelationships(entity));
            var constraint;
            var isEmptyTarget = relationships.some(function (relationship) {
                if (relationship.optional !== true) {
                    var value = typeof entity[relationship.withForeignKey] === "undefined" || entity[relationship.withForeignKey] === null;
                    if (value) {
                        constraint = relationship;
                    }
                    return value;
                }
                else {
                    return false;
                }
            });
            if (isEmptyTarget) {
                throw new Error("Foreign key constraint on relationship.");
            }
            var addSql = this.sqlWriter.createInsertStatement(entity);
            return this.execute(addSql.statement, addSql.values).chain(function (results) {
                var id = results.insertId;
                var newEntity = flattenEntity(entity, true);
                // This could be problematic, because many to many entities often times use the two
                // Foreign keys as their primary key.
                var primaryKeys = _this.edm.getPrimaryKeyProperties(_this.Type);
                if (primaryKeys.length === 1) {
                    newEntity[primaryKeys[0]] = id;
                }
                return new AddedResponse("Entity was successfully added.", newEntity);
            }).catch(function (error) {
                // TODO: we need to get the error messages of the sql.
                return Future.fromError(new ErrorResponse("Sql error."));
            });
        };
        ;
        SqliteDataStore.prototype.update = function (entity, updates) {
            var sql = this.sqlWriter.createUpdateStatement(entity, updates);
            return this.execute(sql.statement, sql.values).chain(function (results) {
                return new UpdatedResponse("Successfully updated the entity.");
            }).catch(function (error) {
                // TODO: Better error messages.
                return Future.fromError(new ErrorResponse("Failed to updated entity."));
            });
        };
        ;
        SqliteDataStore.prototype.remove = function (entity) {
            var sql = this.sqlWriter.createDeleteStatement(entity);
            return this.execute(sql.statement, sql.values).chain(function (results) {
                return new RemovedResponse("Successfully removed the entity.");
            }).catch(function (error) {
                // TODO: Better error messages.
                return Future.fromError(new ErrorResponse("Failed to updated entity."));
            });
        };
        ;
        SqliteDataStore.prototype.drop = function () {
            var _this = this;
            var sql = "DROP TABLE '" + this.tableName + "'";
            return this.execute(sql).catch(function (error) {
                return Future.fromError(new ErrorResponse("Failed to drop table: " + _this.tableName));
            });
        };
        ;
        SqliteDataStore.prototype.getQueryProvider = function () {
            var _this = this;
            var provider = new Provider();
            provider.toArray = provider.execute = function (queryable) {
                var expression = queryable.getExpression();
                var model = _this.edm.getModelByType(_this.Type);
                var visitor = new SqlVisitor(_this.tableName, model);
                var dtos = [];
                var where = "";
                var take = "";
                var skip = "";
                var orderBy = "";
                var defaultTake = 1000;
                var atIndex = 0;
                var sql = "SELECT * FROM " + _this.tableName + " ";
                if (expression.where) {
                    where = visitor.parse(expression.where);
                }
                if (expression.skip) {
                    skip = visitor.parse(expression.skip);
                    atIndex = expression.skip.children[0].value;
                }
                if (expression.take) {
                    take = visitor.parse(expression.take);
                    defaultTake = expression.take.children[0].value;
                }
                if (expression.orderBy) {
                    orderBy = " " + visitor.parse(expression.orderBy);
                }
                sql += where + orderBy + take + skip;
                return _this.execute(sql).then(function (results) {
                    var entities = [];
                    var length = results.rows.length;
                    for (var x = 0; x < length; x++)
                        (function (x) {
                            var dto = results.rows.item(x);
                            var entity = new _this.Type();
                            Object.keys(dto).forEach(function (key) {
                                var Type = _this.properties[key].type;
                                if ((Type === Date || Type === EdmPackage.DateTimeOffset) && dto[key] !== null) {
                                    entity[key] = new Date(dto[key]);
                                }
                                else if (Type === Boolean) {
                                    entity[key] = dto[key] ? true : false;
                                }
                                else {
                                    entity[key] = dto[key];
                                }
                            });
                            entities.push(entity);
                        })(x);
                    return entities;
                });
            };
            return provider;
        };
        ;
        SqliteDataStore.prototype.asQueryable = function () {
            var queryable = new Queryable(this.Type);
            queryable.provider = this.getQueryProvider();
            return queryable;
        };
        ;
        SqliteDataStore.prototype.dispose = function () {
            return Future.fromResult(undefined);
        };
        SqliteDataStore.prototype.onReady = function (callback) {
            return this.readyFuture.then(callback);
        };
        return SqliteDataStore;
    })();
    return SqliteDataStore;
});
