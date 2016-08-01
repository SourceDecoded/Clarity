class DataStore {
    add(entity) {
        // return a Future<AddedResponse>
        throw new Error("This method is expected to be overridden.");
    }

    update(entity, updates) {
        // return a Future<UpdatedResponse>
        throw new Error("This method is expected to be overridden.");
    }

    remove(entity) {
        // return a Future<RemovedResponse>
        throw new Error("This method is expected to be overridden.");
    }

    asQueryable() {
        // return a Queryable
        throw new Error("This method is expected to be overridden.");
    }

    getQueryProvider() {
        // return a Queryable Provider.
        throw new Error("This method is expected to be overridden.");
    }

    initialize() {
        // Return a Future.
        throw new Error("This method is expected to be overridden.");
    }

    dispose() {
        // Return a Future.
        throw new Error("This method is expected to be overridden.");
    }

}

export = DataStore;
