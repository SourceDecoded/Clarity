import DataStore = require("../dataStores/SqliteDataStore");
import Hashmap = require("../../collections/Hashmap");
import Future = require("../../async/Future");

class Sqlite {
    name: string;
    private sizeInMegaBytes: number;
    private size: number;
    private edm: any;
    private db: any;
    private dataStores: Hashmap;
    private dataStoreOnReadyFutures: Hashmap;

    readyFuture: Future<any>;

    // We have to make all the source tables first.
    private createDataStore(Type) {
        var relationships = this.edm.getOneToOneAsTargetRelationships(Type);
        relationships = relationships.concat(this.edm.getOneToManyAsTargetRelationships(Type));

        var futures = relationships.map((relationship) => {
            var Type = relationship.ofType;
            var readyFuture = this.dataStoreOnReadyFutures.get(Type);

            if (readyFuture === null) {
                var dataStore = new DataStore(Type, this.db, this.edm);
                readyFuture = dataStore.onReady();
                this.dataStores.add(Type, dataStore);
                this.dataStoreOnReadyFutures.add(Type, readyFuture);
            }

            return readyFuture;
        });

        return Future.all(futures).chain(() => {
            var dataStore = this.dataStores.get(Type);
            if (dataStore === null) {
                dataStore = new DataStore(Type, this.db, this.edm);
                this.dataStores.add(Type, dataStore);
                this.dataStoreOnReadyFutures.add(Type, dataStore.onReady());
            }
            return dataStore.onReady();
        }).try();
    };

    constructor(config) {
        this.name = config.name;
        this.sizeInMegaBytes = config.sizeInMegaBytes || 5;
        this.size = this.sizeInMegaBytes * 1024 * 1024;
        this.edm = config.edm;
        this.db = (<any>window).openDatabase(name, "1.0", "", this.size);
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

    getEdm() {
        return this.edm;
    }

    add(entity) {
        var dataStore = this.getDataStore(entity.constructor);
        return dataStore.add(entity);
    }

    update(entity, updates) {
        var dataStore = this.getDataStore(entity.constructor);
        return dataStore.update(entity, updates);
    }

    remove(entity) {
        var dataStore = this.getDataStore(entity.constructor);
        return dataStore.remove(entity);
    }

    asQueryable(Type) {
        var dataStore = this.getDataStore(Type);
        return dataStore.asQueryable();
    }

    getQueryProvider(Type) {
        var dataStore = this.getDataStore(Type);
        return dataStore.getQueryProvider();
    }

    onReady(callback?) {
        return this.readyFuture.then(callback);
    };

    getDataStore(Type) {
        var dataStore = this.dataStores.get(Type);
        if (dataStore === null) {
            throw new Error("Couldn't find dataStore for type.");
        }
        return dataStore;
    };

    dropAll() {
        return Future.all(this.dataStores.getKeys().map((key) => {
            return this.dataStores.get(key).drop();
        })).try();
    };
}

export = Sqlite;