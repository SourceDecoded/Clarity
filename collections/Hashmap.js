"use strict";
var Guid = require("../util/Guid");
var Hashmap = (function () {
    function Hashmap() {
        this.hash = {};
        this.keyToObjectKey = {};
    }
    Hashmap.prototype.add = function (key, object) {
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
    };
    ;
    Hashmap.prototype.get = function (key) {
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
    };
    ;
    Hashmap.prototype.remove = function (key) {
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
    };
    ;
    Hashmap.prototype.clear = function () {
        var _this = this;
        this.getKeys().forEach(function (key) {
            _this.remove(key);
        });
    };
    ;
    Hashmap.prototype.hasKey = function (key) {
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
    };
    ;
    Hashmap.prototype.getKeys = function () {
        var keys = [];
        var keyToObjectKey = this.keyToObjectKey;
        Object.keys(this.hash).forEach(function (key) {
            keys.push(keyToObjectKey[key]);
        });
        return keys;
    };
    ;
    Hashmap.prototype.getValues = function () {
        var _this = this;
        var values = [];
        var keys = this.getKeys();
        keys.forEach(function (key) {
            values.push(_this.get(key));
        });
        return values;
    };
    ;
    Hashmap.prototype.copy = function () {
        var _this = this;
        var copy = new Hashmap();
        this.getKeys().forEach(function (key) {
            copy.add(key, _this.get(key));
        });
        return copy;
    };
    ;
    Hashmap.prototype.getItemCount = function () {
        return Object.keys(this.hash).length;
    };
    ;
    return Hashmap;
}());
module.exports = Hashmap;
//# sourceMappingURL=Hashmap.js.map