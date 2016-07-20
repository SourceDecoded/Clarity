var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
define(["require", "exports", "../async/Future", "../util/PropertyBehavior", "../util/Observable", "./responses/ServiceResponse", "./utils"], function (require, exports, Future, PropertyBehavior, Observable, ServiceResponse, utils) {
    var isPrimitive = utils.isPrimitive;
    var BaseState = (function () {
        function BaseState(changeTracker) {
            this.changeTracker = changeTracker;
        }
        BaseState.prototype.add = function () { };
        BaseState.prototype.update = function () { };
        BaseState.prototype.remove = function () { };
        BaseState.prototype.sync = function (dto) {
            var _this = this;
            this.changeTracker.entityObserver.observer.stop();
            Object.keys(dto).forEach(function (key) {
                var value = dto[key];
                if (isPrimitive(dto[key]) && isPrimitive(_this.changeTracker.entity[key])) {
                    _this.changeTracker.entity[key] = value;
                }
            });
            this.changeTracker.entityObserver.start();
        };
        ;
        BaseState.prototype.save = function (service) {
            throw new Error("This should be overridden.");
        };
        BaseState.prototype.detach = function () {
            this.changeTracker.setStateToDetached();
        };
        ;
        return BaseState;
    })();
    var SavingState = (function (_super) {
        __extends(SavingState, _super);
        function SavingState() {
            _super.apply(this, arguments);
        }
        SavingState.prototype.save = function () {
            return this.savingFuture;
        };
        SavingState.prototype.detachedState = function () {
            throw new Error("Cannot detach while saving.");
        };
        return SavingState;
    })(BaseState);
    var LoadedState = (function (_super) {
        __extends(LoadedState, _super);
        function LoadedState() {
            _super.apply(this, arguments);
        }
        LoadedState.prototype.update = function () {
            this.changeTracker.setStateToUpdated();
        };
        LoadedState.prototype.remove = function () {
            this.changeTracker.setStateToRemoved();
        };
        LoadedState.prototype.save = function () {
            return Future.fromResult(new ServiceResponse("Nothing to save."));
        };
        return LoadedState;
    })(BaseState);
    var AddedState = (function (_super) {
        __extends(AddedState, _super);
        function AddedState() {
            _super.apply(this, arguments);
        }
        AddedState.prototype.remove = function () {
            this.changeTracker.setStateToDetached();
        };
        AddedState.prototype.save = function (service) {
            var _this = this;
            var future = service.add(this.changeTracker.entity.constructor, this.changeTracker.entity);
            this.changeTracker.setStateToSaving(future);
            return future.chain(function (response) {
                var dto = response.entity;
                var primaryKeys = _this.changeTracker.edm.getPrimaryKeyProperties(_this.changeTracker.entity.constructor);
                primaryKeys.forEach(function (key) {
                    _this.changeTracker.entity[key] = dto[key];
                });
                _this.sync(dto);
                _this.changeTracker.updateHash = {};
                _this.changeTracker.restoreHash = {};
                _this.changeTracker.setStateToLoaded();
            }).ifError(function () {
                this.changeTracker.setStateToAdded();
            });
        };
        return AddedState;
    })(BaseState);
    var UpdatedState = (function (_super) {
        __extends(UpdatedState, _super);
        function UpdatedState() {
            _super.apply(this, arguments);
        }
        UpdatedState.prototype.remove = function () {
            this.changeTracker.setStateToRemoved();
        };
        UpdatedState.prototype.save = function (service) {
            var _this = this;
            var updates = {};
            var entity = this.changeTracker.entity;
            Object.keys(this.changeTracker.updateHash).forEach(function (key) {
                if (_this.changeTracker.updateHash[key] instanceof Date) {
                    updates[key] = new Date(_this.changeTracker.updateHash[key]);
                }
                else {
                    updates[key] = _this.changeTracker.updateHash[key];
                }
            });
            this.changeTracker.updateHash = {};
            var future = service.update(entity.constructor, entity, updates);
            this.changeTracker.setStateToSaving(future);
            future.then(function () {
                _this.changeTracker.restoreHash = {};
                _this.changeTracker.setStateToLoaded();
            }).ifError(function (errorResponse) {
                var _this = this;
                // This will capture any updates that may have happened while trying to save.
                Object.keys(this.changeTracker.updateHash).forEach(function (key) {
                    updates[key] = _this.changeTracker.updateHash[key];
                });
                this.changeTracker.updateHash = updates;
                this.changeTracker.setStateToUpdated();
            });
            return future;
        };
        return UpdatedState;
    })(BaseState);
    ;
    var RemovedState = (function (_super) {
        __extends(RemovedState, _super);
        function RemovedState() {
            _super.apply(this, arguments);
        }
        RemovedState.prototype.add = function () {
            if (Object.keys(this.changeTracker.updateHash).length > 0) {
                this.changeTracker.setStateToUpdated();
            }
            else {
                this.changeTracker.setStateToLoaded();
            }
        };
        RemovedState.prototype.save = function (service) {
            var _this = this;
            var entity = this.changeTracker.entity;
            var future = service.remove(entity.constructor, entity);
            this.changeTracker.setStateToSaving(future);
            future.then(function () {
                entity.id = null;
                _this.changeTracker.updateHash = {};
                _this.changeTracker.setStateToDetached();
            }).ifError(function () {
                this.changeTracker.changeTracker.setStateToRemoved();
            });
            return future;
        };
        return RemovedState;
    })(BaseState);
    var DetachedState = (function (_super) {
        __extends(DetachedState, _super);
        function DetachedState() {
            _super.apply(this, arguments);
        }
        DetachedState.prototype.add = function () {
            this.changeTracker.setStateToAdded();
        };
        DetachedState.prototype.save = function () {
            // Should we throw an error or simply ignore?
            throw new Error("This should have never been called, because the state is detached.");
        };
        DetachedState.prototype.detach = function () { };
        return DetachedState;
    })(BaseState);
    var ChangeTracker = (function (_super) {
        __extends(ChangeTracker, _super);
        function ChangeTracker(entity, service) {
            var _this = this;
            _super.call(this);
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
            this.edm.getPrimaryKeyProperties(entity.constructor).forEach(function (key) {
                _this.primaryKeys[key] = true;
            });
            this.entityObserver = entity.observe();
            this.entityObserver.filter(function (e) {
                return e.type === "propertyLoad";
            }).onEach(function (e) {
                _this.restoreHash[e.property] = e.newValue;
            });
            this.entityObserver.filter(function (e) {
                if (e.type === "propertyChange") {
                    if (typeof _this.restoreHash[e.property] === "undefined") {
                        _this.restoreHash[e.property] = e.oldValue;
                    }
                    if (isPrimitive(e.oldValue) &&
                        isPrimitive(e.newValue)) {
                        return true;
                    }
                }
                return false;
            }).onEach(function (e) {
                if (!_this.primaryKeys[e.property]) {
                    _this.updateHash[e.property] = e.newValue;
                }
                _this.update();
            });
            this.state = this.detachedState;
        }
        ChangeTracker.prototype.setStateToSaving = function (future) {
            this.savingState.savingFuture = future;
            this.state = this.savingState;
            this.notify({
                type: "saving"
            });
        };
        ChangeTracker.prototype.setStateToDetached = function () {
            this.state = this.detachedState;
            this.entityObserver.dispose();
            this.notify({
                type: "detached"
            });
        };
        ChangeTracker.prototype.setStateToLoaded = function () {
            this.state = this.loadedState;
            this.notify({
                type: "loaded"
            });
        };
        ChangeTracker.prototype.setStateToAdded = function () {
            this.state = this.addedState;
            this.notify({
                type: "added"
            });
        };
        ChangeTracker.prototype.setStateToRemoved = function () {
            this.state = this.removedState;
            this.notify({
                type: "removed"
            });
        };
        ChangeTracker.prototype.setStateToUpdated = function () {
            this.state = this.updatedState;
            this.notify({
                type: "updated"
            });
        };
        ChangeTracker.prototype.add = function () {
            return this.state.add();
        };
        ChangeTracker.prototype.remove = function () {
            return this.state.remove();
        };
        ChangeTracker.prototype.update = function () {
            return this.state.update();
        };
        ChangeTracker.prototype.sync = function (dto) {
            return this.state.sync(dto);
        };
        ChangeTracker.prototype.save = function (service) {
            return this.state.save(service);
        };
        ChangeTracker.prototype.detach = function () {
            return this.state.detach();
        };
        return ChangeTracker;
    })(Observable);
    return ChangeTracker;
});
