var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
define(["require", "exports", "../../async/Future", "../dataStores/InMemoryDataStore", "./DataStoreBackedService", "../../collections/Hashmap"], function (require, exports, Future, InMemoryDataStore, DataStoreBackedService, Hashmap) {
    var InMemoryService = (function (_super) {
        __extends(InMemoryService, _super);
        function InMemoryService(edm) {
            var _this = this;
            _super.call(this, {
                edm: edm,
                readyFuture: Future.fromResult(undefined),
                getDataStore: function (Type) {
                    var dataStore = _this.dataStores.get(Type);
                    if (!dataStore) {
                        dataStore = new InMemoryDataStore(Type, edm);
                        _this.dataStores.add(Type, dataStore);
                    }
                    return dataStore;
                }
            });
            this.dataStores = new Hashmap;
        }
        return InMemoryService;
    })(DataStoreBackedService);
    return InMemoryService;
});
