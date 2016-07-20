import PropertyBehavior = require("../util/PropertyBehavior");
import Future = require("../async/Future");
import ObservableArray = require("../collections/ObservableArray");
var global = (function () { return this; } ());

class Entity {
    private providers: any;
    constructor() {
        
        // Make this entity's properties observable as well.
        PropertyBehavior.call(self);
        
        // Make collections observable.
        Object.keys(self).forEach((key) => {
            if (Array.isArray(self[key])) {
                ObservableArray.call(self[key]);
            }
        });
    }

    // This will load properties and array's on entities.
    load(property) {
        return new Future((setValue, setError) => {
            if (!this.providers[property]) {
                throw new Error("Couldn't find provider for specified property: " + property + ".");
            }

            if (self[property] === null) {
                var getProvider = this.providers[property];
                var future = getProvider(self, property);

                if (!(future instanceof Future)) {
                    throw new Error("Expected provider to return a Future.");
                }

                future.then((value) => {
                    (<any>this).loadProperty(property, value);
                    setValue(value);
                }).ifError(setError);
            } else {
                setValue(this[property]);
            }
        });
    };
        
    // This helps with registering navigable properties, and arrays found on the entity.
    registerProvider(property, getProvider) {
        this.providers[property] = getProvider;
    };

    unregisterProvider(property) {
        this.providers[property] = null;
    };
}

export = Entity;
