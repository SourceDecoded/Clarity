class Service {
    add(Type, entity) {
        throw new Error("This was meant to be overridden.");
    }

    update(Type, entity, updates) {
        throw new Error("This was meant to be overridden.");
    }

    remove(Type, entity) {
        throw new Error("This was meant to be overridden.");
    }

    getSourcesOneToOneTargetEntity(sourceEntity, relationship) {
        throw new Error("This was meant to be overridden.");
    }

    getTargetsOneToOneSourceEntity(targetEntity, relationship) {
        throw new Error("This was meant to be overridden.");
    }

    getSourcesOneToManyQueryProvider(sourceEntity, relationship) {
        throw new Error("This was meant to be overridden.");
    }

    getTargetsOneToManySourceEntity(targetEntity, relationship) {
        throw new Error("This was meant to be overridden.");
    }

    getSourcesManyToManyQueryProvider(sourceEntity, relationship) {
        throw new Error("This was meant to be overridden.");
    }

    getTargetsManyToManyQueryProvider(targetEntity, relationship) {
        throw new Error("This was meant to be overridden.");
    }

    getQueryProvider(Type) {
        throw new Error("This was meant to be overridden.");
    }

    asQueryable(Type) {
        throw new Error("This was meant to be overridden.");
    }

    getEdm() {
        throw new Error("This was meant to be overridden.");
    }

    supportsType(Type) {
        throw new Error("This was meant to be overridden.");
    }

    initialize() {
        throw new Error("This was meant to be overridden.");
    }

    dispose() {
        throw new Error("This was meant to be overridden.");
    }
    
    // Optional interfaces
    createHook(Type) {
        throw new Error("This was meant to be overridden.");
    }

    addTransactionService(name, transactionService) {
        // transactionService needs to have these methods.
        // startTransaction()
        // endTransaction()
        // add(entity) --> Future<AddedResponse>
        // update(entity) --> Future<UpdatedResponse>
        // remove(entity) --> Future<RemovedResponse>
        throw new Error("This was meant to be overridden.");
    }

    getTransactionService(name) {
        throw new Error("This was meant to be overridden.");
    }
    
    // parameters is a object literal of key values.
    invokeClassMethod(Type, methodName, parameters) {

    }
    
    // parameters is a object literal of key values.
    invokeInstanceMethod(Type, entity, methodName, parameters) {

    }

}

export = Service;
