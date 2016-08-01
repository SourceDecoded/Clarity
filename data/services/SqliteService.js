var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
define(["require", "exports", "./DataStoreBackedService"], function (require, exports, DataStoreBackedService) {
    var SqliteService = (function (_super) {
        __extends(SqliteService, _super);
        function SqliteService(sqlite) {
            _super.call(this, {
                edm: sqlite.getEdm(),
                name: sqlite.name,
                readyFuture: sqlite.onReady(),
                getDataStore: function (Type) {
                    return sqlite.getDataStore(Type);
                }
            });
        }
        return SqliteService;
    })(DataStoreBackedService);
    return SqliteService;
});
