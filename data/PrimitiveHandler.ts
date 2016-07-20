import Hashmap = require("../collections/Hashmap");

class PrimitiveHandler {
    handlers: Hashmap;
    constructor() {
        this.handlers = new Hashmap();
    }

    addHandler(PrimitiveType, handler) {
        this.handlers.add(PrimitiveType, handler);
    }

    getHandler(Type) {
        return this.handlers.get(Type);
    }

    resolve(model, dto) {
        var Type = model.type;
        var properties = model.properties;

        var entity = new Type();
        Object.keys(properties).forEach(function (key) {
            var handler = this.handlers.get(properties[key].type);
            if (typeof handler === "function") {
                entity[key] = handler(dto[key]);
            } else if (properties[key].type !== Array && Array.isArray(dto[key])) {
                entity[key] = dto[key];
            } else if (typeof dto[key] !== "undefined") {
                entity[key] = dto[key];
            }
        });

        return entity;
    }
}

export = PrimitiveHandler;