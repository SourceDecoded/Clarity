define(["require", "exports"], function (require, exports) {
    var Service = (function () {
        function Service() {
        }
        Service.prototype.add = function (Type, entity) {
            throw new Error("This was meant to be overridden.");
        };
        Service.prototype.update = function (Type, entity, updates) {
            throw new Error("This was meant to be overridden.");
        };
        Service.prototype.remove = function (Type, entity) {
            throw new Error("This was meant to be overridden.");
        };
        Service.prototype.getSourcesOneToOneTargetEntity = function (sourceEntity, relationship) {
            throw new Error("This was meant to be overridden.");
        };
        Service.prototype.getTargetsOneToOneSourceEntity = function (targetEntity, relationship) {
            throw new Error("This was meant to be overridden.");
        };
        Service.prototype.getSourcesOneToManyQueryProvider = function (sourceEntity, relationship) {
            throw new Error("This was meant to be overridden.");
        };
        Service.prototype.getTargetsOneToManySourceEntity = function (targetEntity, relationship) {
            throw new Error("This was meant to be overridden.");
        };
        Service.prototype.getSourcesManyToManyQueryProvider = function (sourceEntity, relationship) {
            throw new Error("This was meant to be overridden.");
        };
        Service.prototype.getTargetsManyToManyQueryProvider = function (targetEntity, relationship) {
            throw new Error("This was meant to be overridden.");
        };
        Service.prototype.getQueryProvider = function (Type) {
            throw new Error("This was meant to be overridden.");
        };
        Service.prototype.asQueryable = function (Type) {
            throw new Error("This was meant to be overridden.");
        };
        Service.prototype.getEdm = function () {
            throw new Error("This was meant to be overridden.");
        };
        Service.prototype.supportsType = function (Type) {
            throw new Error("This was meant to be overridden.");
        };
        Service.prototype.initialize = function () {
            throw new Error("This was meant to be overridden.");
        };
        Service.prototype.dispose = function () {
            throw new Error("This was meant to be overridden.");
        };
        // Optional interfaces
        Service.prototype.createHook = function (Type) {
            throw new Error("This was meant to be overridden.");
        };
        Service.prototype.addTransactionService = function (name, transactionService) {
            // transactionService needs to have these methods.
            // startTransaction()
            // endTransaction()
            // add(entity) --> Future<AddedResponse>
            // update(entity) --> Future<UpdatedResponse>
            // remove(entity) --> Future<RemovedResponse>
            throw new Error("This was meant to be overridden.");
        };
        Service.prototype.getTransactionService = function (name) {
            throw new Error("This was meant to be overridden.");
        };
        // parameters is a object literal of key values.
        Service.prototype.invokeClassMethod = function (Type, methodName, parameters) {
        };
        // parameters is a object literal of key values.
        Service.prototype.invokeInstanceMethod = function (Type, entity, methodName, parameters) {
        };
        return Service;
    })();
    return Service;
});
