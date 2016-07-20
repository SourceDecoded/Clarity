define(["require", "exports", "../dataStores/SqliteDataStore", "../../collections/Hashmap", "../../async/Future"], function (require, exports, DataStore, Hashmap, Future) {
    var Sqlite = (function () {
        function Sqlite(config) {
            this.name = config.name;
            this.sizeInMegaBytes = config.sizeInMegaBytes || 5;
            this.size = this.sizeInMegaBytes * 1024 * 1024;
            this.edm = config.edm;
            this.db = window.openDatabase(name, "1.0", "", this.size);
            this.dataStores = new Hashmap();
            this.dataStoreOnReadyFutures = new Hashmap();
            if (typeof this.edm === "undefined") {
                throw new Error("The edm cannot be undefined.");
            }
            if (typeof this.name !== "string") {
                throw new Error("Database needs a name.");
            }
            this.edm.getModels().getValues().forEach(function (model) {
                this.createDataStore(model.type);
            });
            this.readyFuture = Future.all(this.dataStoreOnReadyFutures.getValues()).try();
        }
        // We have to make all the source tables first.
        Sqlite.prototype.createDataStore = function (Type) {
            var _this = this;
            var relationships = this.edm.getOneToOneAsTargetRelationships(Type);
            relationships = relationships.concat(this.edm.getOneToManyAsTargetRelationships(Type));
            var futures = relationships.map(function (relationship) {
                var Type = relationship.ofType;
                var readyFuture = _this.dataStoreOnReadyFutures.get(Type);
                if (readyFuture === null) {
                    var dataStore = new DataStore(Type, _this.db, _this.edm);
                    readyFuture = dataStore.onReady();
                    _this.dataStores.add(Type, dataStore);
                    _this.dataStoreOnReadyFutures.add(Type, readyFuture);
                }
                return readyFuture;
            });
            return Future.all(futures).chain(function () {
                var dataStore = _this.dataStores.get(Type);
                if (dataStore === null) {
                    dataStore = new DataStore(Type, _this.db, _this.edm);
                    _this.dataStores.add(Type, dataStore);
                    _this.dataStoreOnReadyFutures.add(Type, dataStore.onReady());
                }
                return dataStore.onReady();
            }).try();
        };
        ;
        Sqlite.prototype.getEdm = function () {
            return this.edm;
        };
        Sqlite.prototype.add = function (entity) {
            var dataStore = this.getDataStore(entity.constructor);
            return dataStore.add(entity);
        };
        Sqlite.prototype.update = function (entity, updates) {
            var dataStore = this.getDataStore(entity.constructor);
            return dataStore.update(entity, updates);
        };
        Sqlite.prototype.remove = function (entity) {
            var dataStore = this.getDataStore(entity.constructor);
            return dataStore.remove(entity);
        };
        Sqlite.prototype.asQueryable = function (Type) {
            var dataStore = this.getDataStore(Type);
            return dataStore.asQueryable();
        };
        Sqlite.prototype.getQueryProvider = function (Type) {
            var dataStore = this.getDataStore(Type);
            return dataStore.getQueryProvider();
        };
        Sqlite.prototype.onReady = function (callback) {
            return this.readyFuture.then(callback);
        };
        ;
        Sqlite.prototype.getDataStore = function (Type) {
            var dataStore = this.dataStores.get(Type);
            if (dataStore === null) {
                throw new Error("Couldn't find dataStore for type.");
            }
            return dataStore;
        };
        ;
        Sqlite.prototype.dropAll = function () {
            var _this = this;
            return Future.all(this.dataStores.getKeys().map(function (key) {
                return _this.dataStores.get(key).drop();
            })).try();
        };
        ;
        return Sqlite;
    })();
    return Sqlite;
});
