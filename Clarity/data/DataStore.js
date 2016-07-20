define(["require", "exports"], function (require, exports) {
    var DataStore = (function () {
        function DataStore() {
        }
        DataStore.prototype.add = function (entity) {
            // return a Future<AddedResponse>
            throw new Error("This method is expected to be overridden.");
        };
        DataStore.prototype.update = function (entity, updates) {
            // return a Future<UpdatedResponse>
            throw new Error("This method is expected to be overridden.");
        };
        DataStore.prototype.remove = function (entity) {
            // return a Future<RemovedResponse>
            throw new Error("This method is expected to be overridden.");
        };
        DataStore.prototype.asQueryable = function () {
            // return a Queryable
            throw new Error("This method is expected to be overridden.");
        };
        DataStore.prototype.getQueryProvider = function () {
            // return a Queryable Provider.
            throw new Error("This method is expected to be overridden.");
        };
        DataStore.prototype.initialize = function () {
            // Return a Future.
            throw new Error("This method is expected to be overridden.");
        };
        DataStore.prototype.dispose = function () {
            // Return a Future.
            throw new Error("This method is expected to be overridden.");
        };
        return DataStore;
    })();
    return DataStore;
});
