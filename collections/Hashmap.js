"use strict";
const Guid = require("../util/Guid");
class Hashmap {
    constructor() {
        this.hash = {};
        this.keyToObjectKey = {};
    }
    add(key, object) {
        if (key == null) {
            throw new Error("Cannot add an object with a null or undefined key. object: " + object);
        }
        if (typeof key === "string" || typeof key === "number") {
            this.keyToObjectKey[key] = key;
            this.hash[key] = object;
            return;
        }
        if (typeof key._hash !== "string") {
            key._hash = Guid.create();
        }
        this.keyToObjectKey[key._hash] = key;
        this.hash[key._hash] = object;
    }
    ;
    get(key) {
        if (key == null) {
            return null;
        }
        if (typeof key === "string" || typeof key === "number") {
            return !this.hash.hasOwnProperty(key) ? null : this.hash[key];
        }
        if (typeof key._hash === "string" && this.hash.hasOwnProperty(key._hash)) {
            return this.hash[key._hash];
        }
        return null;
    }
    ;
    remove(key) {
        if (key === null || typeof key === "undefined") {
            return null;
        }
        var value;
        if (this.hash.hasOwnProperty(key) && typeof key === "string" || typeof key === "number") {
            value = this.hash[key];
            delete this.hash[key];
            delete this.keyToObjectKey[key];
            return value || null;
        }
        if (typeof key._hash === "string" && this.hash.hasOwnProperty(key._hash)) {
            value = this.hash[key._hash];
            delete this.hash[key._hash];
            delete this.keyToObjectKey[key._hash];
            return value;
        }
        return null;
    }
    ;
    clear() {
        this.getKeys().forEach((key) => {
            this.remove(key);
        });
    }
    ;
    hasKey(key) {
        if (key == null) {
            return false;
        }
        if (typeof key === "string" || typeof key === "number") {
            return this.hash.hasOwnProperty(key) ? true : false;
        }
        if (key._hash && this.hash.hasOwnProperty(key._hash)) {
            return true;
        }
        return false;
    }
    ;
    getKeys() {
        var keys = [];
        var keyToObjectKey = this.keyToObjectKey;
        Object.keys(this.hash).forEach((key) => {
            keys.push(keyToObjectKey[key]);
        });
        return keys;
    }
    ;
    getValues() {
        var values = [];
        var keys = this.getKeys();
        keys.forEach((key) => {
            values.push(this.get(key));
        });
        return values;
    }
    ;
    copy() {
        var copy = new Hashmap();
        this.getKeys().forEach((key) => {
            copy.add(key, this.get(key));
        });
        return copy;
    }
    ;
    getItemCount() {
        return Object.keys(this.hash).length;
    }
    ;
}
module.exports = Hashmap;
//# sourceMappingURL=Hashmap.js.map