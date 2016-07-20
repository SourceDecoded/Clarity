define(["require", "exports", "../collections/Hashmap"], function (require, exports, Hashmap) {
    var PrimitiveHandler = (function () {
        function PrimitiveHandler() {
            this.handlers = new Hashmap();
        }
        PrimitiveHandler.prototype.addHandler = function (PrimitiveType, handler) {
            this.handlers.add(PrimitiveType, handler);
        };
        PrimitiveHandler.prototype.getHandler = function (Type) {
            return this.handlers.get(Type);
        };
        PrimitiveHandler.prototype.resolve = function (model, dto) {
            var Type = model.type;
            var properties = model.properties;
            var entity = new Type();
            Object.keys(properties).forEach(function (key) {
                var handler = this.handlers.get(properties[key].type);
                if (typeof handler === "function") {
                    entity[key] = handler(dto[key]);
                }
                else if (properties[key].type !== Array && Array.isArray(dto[key])) {
                    entity[key] = dto[key];
                }
                else if (typeof dto[key] !== "undefined") {
                    entity[key] = dto[key];
                }
            });
            return entity;
        };
        return PrimitiveHandler;
    })();
    return PrimitiveHandler;
});
