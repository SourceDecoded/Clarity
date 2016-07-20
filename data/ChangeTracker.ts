import Future = require("../async/Future");
import PropertyBehavior = require("../util/PropertyBehavior");
import Observable = require("../util/Observable");
import ServiceResponse = require("./responses/ServiceResponse");
import utils = require("./utils");

var isPrimitive = utils.isPrimitive;

class BaseState {
    changeTracker: ChangeTracker;
    constructor(changeTracker: ChangeTracker) {
        this.changeTracker = changeTracker;
    }
    add() { }
    update() { }
    remove() { }
    sync(dto) {
        this.changeTracker.entityObserver.observer.stop();

        Object.keys(dto).forEach((key) => {
            var value = dto[key];
            if (isPrimitive(dto[key]) && isPrimitive(this.changeTracker.entity[key])) {
                this.changeTracker.entity[key] = value;
            }
        });

        this.changeTracker.entityObserver.start();
    };
    save(service) {
        throw new Error("This should be overridden.");
    }

    detach() {
        this.changeTracker.setStateToDetached();
    };
}

class SavingState extends BaseState {
    savingFuture: Future<any>;
    save() {
        return this.savingFuture;
    }
    detachedState() {
        throw new Error("Cannot detach while saving.");
    }
}

class LoadedState extends BaseState {
    update() {
        this.changeTracker.setStateToUpdated();
    }
    remove() {
        this.changeTracker.setStateToRemoved();
    }
    save() {
        return Future.fromResult(new ServiceResponse("Nothing to save."));
    }
}


class AddedState extends BaseState {
    remove() {
        this.changeTracker.setStateToDetached();
    }

    save(service) {
        var future = service.add(this.changeTracker.entity.constructor, this.changeTracker.entity);
        this.changeTracker.setStateToSaving(future);

        return future.chain((response) => {
            var dto = response.entity;

            var primaryKeys = this.changeTracker.edm.getPrimaryKeyProperties(this.changeTracker.entity.constructor);
            primaryKeys.forEach((key) => {
                this.changeTracker.entity[key] = dto[key];
            });

            this.sync(dto);
            this.changeTracker.updateHash = {};
            this.changeTracker.restoreHash = {};
            this.changeTracker.setStateToLoaded();
        }).ifError(function () {
            this.changeTracker.setStateToAdded();
        });
    }
}


class UpdatedState extends BaseState {
    remove() {
        this.changeTracker.setStateToRemoved();
    }

    save(service) {
        var updates = {};
        var entity = this.changeTracker.entity;

        Object.keys(this.changeTracker.updateHash).forEach((key) => {
            if (this.changeTracker.updateHash[key] instanceof Date) {
                updates[key] = new Date(this.changeTracker.updateHash[key]);
            } else {
                updates[key] = this.changeTracker.updateHash[key];
            }
        });

        this.changeTracker.updateHash = {};
        var future = service.update(entity.constructor, entity, updates);

        this.changeTracker.setStateToSaving(future);

        future.then(() => {
            this.changeTracker.restoreHash = {};
            this.changeTracker.setStateToLoaded();
        }).ifError(function (errorResponse) {
            // This will capture any updates that may have happened while trying to save.
            Object.keys(this.changeTracker.updateHash).forEach((key) => {
                updates[key] = this.changeTracker.updateHash[key];
            });

            this.changeTracker.updateHash = updates;
            this.changeTracker.setStateToUpdated();

        });

        return future;
    }

};

class RemovedState extends BaseState {
    add() {
        if (Object.keys(this.changeTracker.updateHash).length > 0) {
            this.changeTracker.setStateToUpdated();
        } else {
            this.changeTracker.setStateToLoaded();
        }
    }
    save(service) {
        var entity = this.changeTracker.entity;
        var future = service.remove(entity.constructor, entity);

        this.changeTracker.setStateToSaving(future);

        future.then(() => {
            entity.id = null;
            this.changeTracker.updateHash = {};
            this.changeTracker.setStateToDetached();
        }).ifError(function () {
            this.changeTracker.changeTracker.setStateToRemoved();
        });

        return future;
    }
}


class DetachedState extends BaseState {
    add() {
        this.changeTracker.setStateToAdded();
    }

    save() {
        // Should we throw an error or simply ignore?
        throw new Error("This should have never been called, because the state is detached.");
    }

    detach() { }
}

class ChangeTracker extends Observable {
    updateHash;
    restoreHash;
    primaryKeys;
    edm;
    entityObserver;
    entity;
    state;
    loadedState;
    detachedState;
    addedState;
    removedState;
    updatedState;
    savingState;

    constructor(entity, service) {
        super();
        var changeTracker = self;

        PropertyBehavior.call(entity);

        this.entity = entity;
        this.edm = service.getEdm();
        this.updateHash = {};
        this.restoreHash = {};
        this.primaryKeys = {};
        this.loadedState = new LoadedState(this);
        this.detachedState = new DetachedState(this);
        this.addedState = new AddedState(this);
        this.removedState = new RemovedState(this);
        this.updatedState = new UpdatedState(this);
        this.savingState = new SavingState(this);

        this.edm.getPrimaryKeyProperties(entity.constructor).forEach((key) => {
            this.primaryKeys[key] = true;
        });

        this.entityObserver = entity.observe();

        this.entityObserver.filter((e) => {
            return e.type === "propertyLoad";
        }).onEach((e) => {
            this.restoreHash[e.property] = e.newValue;
        });

        this.entityObserver.filter((e) => {
            if (e.type === "propertyChange") {
                if (typeof this.restoreHash[e.property] === "undefined") {
                    this.restoreHash[e.property] = e.oldValue;
                }
                if (isPrimitive(e.oldValue) &&
                    isPrimitive(e.newValue)) {
                    return true;
                }
            }
            return false;
        }).onEach((e) => {

            if (!this.primaryKeys[e.property]) {
                this.updateHash[e.property] = e.newValue;
            }

            this.update();
        });

        this.state = this.detachedState;

    }

    setStateToSaving(future) {
        this.savingState.savingFuture = future;
        this.state = this.savingState;
        this.notify({
            type: "saving"
        });
    }

    setStateToDetached() {
        this.state = this.detachedState;
        this.entityObserver.dispose();
        this.notify({
            type: "detached"
        });
    }

    setStateToLoaded() {
        this.state = this.loadedState;
        this.notify({
            type: "loaded"
        });
    }

    setStateToAdded() {
        this.state = this.addedState;
        this.notify({
            type: "added"
        });
    }

    setStateToRemoved() {
        this.state = this.removedState;
        this.notify({
            type: "removed"
        });
    }

    setStateToUpdated() {
        this.state = this.updatedState;
        this.notify({
            type: "updated"
        });
    }

    add() {
        return this.state.add();
    }

    remove() {
        return this.state.remove();
    }

    update() {
        return this.state.update();
    }

    sync(dto) {
        return this.state.sync(dto);
    }

    save(service) {
        return this.state.save(service);
    }

    detach() {
        return this.state.detach();
    }
}

export = ChangeTracker;