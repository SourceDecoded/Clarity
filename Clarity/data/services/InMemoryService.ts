import Future = require("../../async/Future");
import InMemoryDataStore = require("../dataStores/InMemoryDataStore");
import DataStoreBackedService = require("./DataStoreBackedService");
import Hashmap = require("../../collections/Hashmap");

class InMemoryService extends DataStoreBackedService {
    dataStores;
    constructor(edm) {
        super({
            edm: edm,
            readyFuture: Future.fromResult(undefined),
            getDataStore: (Type) => {
                var dataStore = this.dataStores.get(Type);
                if (!dataStore) {
                    dataStore = new InMemoryDataStore(Type, edm);
                    this.dataStores.add(Type, dataStore);
                }

                return dataStore;
            }
        });

        this.dataStores = new Hashmap;

    }
}

export = InMemoryService;

