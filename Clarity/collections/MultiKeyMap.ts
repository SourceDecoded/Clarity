import Hashmap = require("./Hashmap");

class MultiKeyMap {
    nestedHash: Hashmap;
    setup(key1, key2) {
        if (!this.nestedHash.hasKey(key1)) {
            this.nestedHash.add(key1, new Hashmap());
        }
    };

    add(key1, key2, value) {
        if (arguments.length === 3) {
            this.setup(key1, key2);

            var key2Hash = this.nestedHash.get(key1);
            key2Hash.add(key2, value);
        } else {
            if (key2 instanceof Hashmap) {
                this.nestedHash.add(key1, key2);
            } else {
                throw new Error("Invalid parameters.");
            }
        }

    };

    get(key1, key2?) {
        if (this.nestedHash.hasKey(key1)) {
            if (key2 !== null && typeof key2 !== "undefined") {
                var key2Hash = this.nestedHash.get(key1);
                var value = key2Hash.get(key2);

                return value ? value : null;
            } else {
                return this.nestedHash.get(key1);
            }
        } else {
            return null;
        }
    };

    remove(key1, key2?) {
        if (this.nestedHash.hasKey(key1)) {
            if (key2 !== null && typeof key2 !== "undefined") {
                var key2Hash = this.nestedHash.get(key1);
                var value = key2Hash.remove(key2);

                if (key2Hash.getKeys().length === 0) {
                    this.nestedHash.remove(key1);
                }

                return value;
            } else {
                return this.nestedHash.remove(key1);
            }
        } else {
            return null;
        }
    };

    copy() {
        var copy = new MultiKeyMap();

        this.nestedHash.getKeys().forEach(function (key) {
            this.nestedHash.get(key).getKeys().forEach(function (nestedKey) {
                copy.add(key, nestedKey, this.get(key, nestedKey));
            });
        });

        return copy;
    };

    clear() {
        this.getKeys().forEach(function (key) {
            this.remove(key);
        });
    };

    getKeys() {
        return this.nestedHash.getKeys();
    };

    hasKey(key1, key2) {
        return this.get(key1, key2) ? true : false;
    };

    constructor() {
        this.nestedHash = new Hashmap();
    }
}

export = MultiKeyMap;