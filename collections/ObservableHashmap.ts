import Hashmap = require("./Hashmap");
import Observable = require("../util/Observable");

var global = (function () { return this; } ());

class ObservableHashmap extends Observable {
    private _hashmap: Hashmap;
    constructor() {
        super();

        this._hashmap = new Hashmap();
    }

    add(key, object) {
        var returnValue = this._hashmap.add(key, object);

        this.notify({
            type: "itemAdded",
            item: object
        });

        return returnValue;
    };

    get(key) {
        return this._hashmap.get(key);
    };

    remove(key) {
        var returnValue = this._hashmap.remove(key);
        this.notify({
            type: "itemRemoved",
            item: returnValue
        });
        return returnValue;
    };

    hasKey(key) {
        return this._hashmap.hasKey(key);
    };

    getKeys() {
        return this._hashmap.getKeys();
    };

    copy() {
        var copy = new ObservableHashmap();
        this._hashmap.getKeys().forEach((key) => {
            copy.add(key, this._hashmap.get(key));
        });

        return copy;
    };
}
