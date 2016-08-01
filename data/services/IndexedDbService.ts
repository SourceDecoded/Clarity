import EdmPackage = require("../Edm");
import intersect = require("../../array/intersect");
import Future = require("../../async/Future");
import convertToArray = require("../../array/convertToArray");
import Hashmap = require("../../collections/Hashmap");
import DataStoreBackedService = require("./DataStoreBackedService");
import IndexedDbDataStore = require("../dataStores/IndexedDbDataStore");

// In the following line, you should include the prefixes of implementations you want to test.
(<any>window).indexedDB = (<any>window).indexedDB || (<any>window).mozIndexedDB || (<any>window).webkitIndexedDB || (<any>window).msIndexedDB;
// DON'T use "var indexedDB = ..." if you're not in a function.
// Moreover, you may need references to some (<any>window).IDB* objects:
(<any>window).IDBTransaction = (<any>window).IDBTransaction || (<any>window).webkitIDBTransaction || (<any>window).msIDBTransaction;
(<any>window).IDBKeyRange = (<any>window).IDBKeyRange || (<any>window).webkitIDBKeyRange || (<any>window).msIDBKeyRange;
// (Mozilla has never prefixed these objects, so we don't need (<any>window).mozIDB*)

class IndexedDbService extends DataStoreBackedService {
    private models: any;
    private databaseName: string;
    private version: number;
    private dataStores: Hashmap;

    constructor(config) {
        super({
            edm: config.edm,
            readyFuture: new Future((setValue, setError) => {
                this.models = this.edm.getModels();
                this.databaseName = config.name;
                this.version = config.version || 1;
                this.dataStores = new Hashmap();
                var request = indexedDB.open(this.databaseName, this.version);

                var startUp = (db) => {
                    var dataStoreSetupFutures = this.models.getValues().map((model) => {
                        var dataStore = new IndexedDbDataStore(model.type, this.edm);
                        this.dataStores.add(model.type, dataStore);
                        return dataStore.initialize(db);
                    }).finally(() => {
                        db.close();
                    });
                };

                request.onsuccess = (event) => {
                    var db = (<any>event.target).result;

                    this.models.getValues().map((model) => {
                        var dataStore = new IndexedDbDataStore(model.type, this.edm);
                        this.dataStores.add(model.type, dataStore);
                        dataStore.setDatabase(db);
                    });

                    setValue(undefined);
                };

                request.onupgradeneeded = (event) => {
                    var db = (<any>event.target).result;

                    (<any>convertToArray(db.objectStoreNames)).intersect(this.models.getKeys()).forEach((model) => {
                        db.deleteObjectStore(model);
                    });

                    startUp(db);
                };

            }),
            getDataStore: (Type) => {
                var dataStore = this.dataStores.get(Type);
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
}