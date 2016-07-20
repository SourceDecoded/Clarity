define(["require", "exports", "../util/PropertyBehavior", "../async/Future", "../collections/ObservableArray"], function (require, exports, PropertyBehavior, Future, ObservableArray) {
    var global = (function () { return this; }());
    var Entity = (function () {
        function Entity() {
            // Make this entity's properties observable as well.
            PropertyBehavior.call(self);
            // Make collections observable.
            Object.keys(self).forEach(function (key) {
                if (Array.isArray(self[key])) {
                    ObservableArray.call(self[key]);
                }
            });
        }
        // This will load properties and array's on entities.
        Entity.prototype.load = function (property) {
            var _this = this;
            return new Future(function (setValue, setError) {
                if (!_this.providers[property]) {
                    throw new Error("Couldn't find provider for specified property: " + property + ".");
                }
                if (self[property] === null) {
                    var getProvider = _this.providers[property];
                    var future = getProvider(self, property);
                    if (!(future instanceof Future)) {
                        throw new Error("Expected provider to return a Future.");
                    }
                    future.then(function (value) {
                        _this.loadProperty(property, value);
                        setValue(value);
                    }).ifError(setError);
                }
                else {
                    setValue(_this[property]);
                }
            });
        };
        ;
        // This helps with registering navigable properties, and arrays found on the entity.
        Entity.prototype.registerProvider = function (property, getProvider) {
            this.providers[property] = getProvider;
        };
        ;
        Entity.prototype.unregisterProvider = function (property) {
            this.providers[property] = null;
        };
        ;
        return Entity;
    })();
    return Entity;
});
