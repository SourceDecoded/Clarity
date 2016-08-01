var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
define(["require", "exports", "../../async/Future", "../../array/convertToArray", "../../collections/Hashmap", "./DataStoreBackedService", "../dataStores/IndexedDbDataStore"], function (require, exports, Future, convertToArray, Hashmap, DataStoreBackedService, IndexedDbDataStore) {
    // In the following line, you should include the prefixes of implementations you want to test.
    window.indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
    // DON'T use "var indexedDB = ..." if you're not in a function.
    // Moreover, you may need references to some (<any>window).IDB* objects:
    window.IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction || window.msIDBTransaction;
    window.IDBKeyRange = window.IDBKeyRange || window.webkitIDBKeyRange || window.msIDBKeyRange;
    // (Mozilla has never prefixed these objects, so we don't need (<any>window).mozIDB*)
    var IndexedDbService = (function (_super) {
        __extends(IndexedDbService, _super);
        function IndexedDbService(config) {
            var _this = this;
            _super.call(this, {
                edm: config.edm,
                readyFuture: new Future(function (setValue, setError) {
                    _this.models = _this.edm.getModels();
                    _this.databaseName = config.name;
                    _this.version = config.version || 1;
                    _this.dataStores = new Hashmap();
                    var request = indexedDB.open(_this.databaseName, _this.version);
                    var startUp = function (db) {
                        var dataStoreSetupFutures = _this.models.getValues().map(function (model) {
                            var dataStore = new IndexedDbDataStore(model.type, _this.edm);
                            _this.dataStores.add(model.type, dataStore);
                            return dataStore.initialize(db);
                        }).finally(function () {
                            db.close();
                        });
                    };
                    request.onsuccess = function (event) {
                        var db = event.target.result;
                        _this.models.getValues().map(function (model) {
                            var dataStore = new IndexedDbDataStore(model.type, _this.edm);
                            _this.dataStores.add(model.type, dataStore);
                            dataStore.setDatabase(db);
                        });
                        setValue(undefined);
                    };
                    request.onupgradeneeded = function (event) {
                        var db = event.target.result;
                        convertToArray(db.objectStoreNames).intersect(_this.models.getKeys()).forEach(function (model) {
                            db.deleteObjectStore(model);
                        });
                        startUp(db);
                    };
                }),
                getDataStore: function (Type) {
                    var dataStore = _this.dataStores.get(Type);
                    if (!dataStore) {
                        throw new Error("This service doesn't support that Type." + Type);
                    }
                    return dataStore;
                }
            });
            if (typeof this.databaseName === "undefined") {
                throw new Error("IndexedDb needs to have a name for the database.");
            }
        }
        return IndexedDbService;
    })(DataStoreBackedService);
});
