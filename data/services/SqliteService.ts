import Future = require("../../async/Future");
import DataStoreBackedService = require("./DataStoreBackedService");
import Hashmap = require("../../collections/Hashmap");
import Sqlite = require("../databases/Sqlite");

class SqliteService extends DataStoreBackedService {
    constructor(sqlite: Sqlite) {
        super({
            edm: sqlite.getEdm(),
            name: sqlite.name,
            readyFuture: sqlite.onReady(),
            getDataStore: function (Type) {
                return sqlite.getDataStore(Type);
            }
        });
    }
}

export = SqliteService;
