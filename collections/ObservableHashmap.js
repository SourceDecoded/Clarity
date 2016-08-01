var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
define(["require", "exports", "./Hashmap", "../util/Observable"], function (require, exports, Hashmap, Observable) {
    var global = (function () { return this; }());
    var ObservableHashmap = (function (_super) {
        __extends(ObservableHashmap, _super);
        function ObservableHashmap() {
            _super.call(this);
            this._hashmap = new Hashmap();
        }
        ObservableHashmap.prototype.add = function (key, object) {
            var returnValue = this._hashmap.add(key, object);
            this.notify({
                type: "itemAdded",
                item: object
            });
            return returnValue;
        };
        ;
        ObservableHashmap.prototype.get = function (key) {
            return this._hashmap.get(key);
        };
        ;
        ObservableHashmap.prototype.remove = function (key) {
            var returnValue = this._hashmap.remove(key);
            this.notify({
                type: "itemRemoved",
                item: returnValue
            });
            return returnValue;
        };
        ;
        ObservableHashmap.prototype.hasKey = function (key) {
            return this._hashmap.hasKey(key);
        };
        ;
        ObservableHashmap.prototype.getKeys = function () {
            return this._hashmap.getKeys();
        };
        ;
        ObservableHashmap.prototype.copy = function () {
            var _this = this;
            var copy = new ObservableHashmap();
            this._hashmap.getKeys().forEach(function (key) {
                copy.add(key, _this._hashmap.get(key));
            });
            return copy;
        };
        ;
        return ObservableHashmap;
    })(Observable);
});
