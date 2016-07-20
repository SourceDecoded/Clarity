"use strict";
var Observer = require("./Observer");
var Rect = require("./Rect");
var View = (function () {
    function View() {
        this._x = 0;
        this._y = 0;
        this._width = 0;
        this._height = 0;
        this.lastX = 0;
        this.lastY = 0;
        this.lastWidth = 0;
        this.lastHeight = 0;
        this.dirty = false;
        this.children = [];
        this.behaviors = [];
        this._observers = {};
        this.parent = null;
        this.services = {};
        this.addedChildMutationEvent = {
            type: "addedChildMutation",
            child: null,
            parent: this
        };
        this.removedChildMutationEvent = {
            type: "removedChildMutation",
            child: null,
            parent: this
        };
        this.addedBehaviorEvent = {
            type: "addedBehavior",
            behavior: null,
            view: this
        };
        this.removedBehaviorEvent = {
            type: "removedBehavior",
            behavior: null,
            view: this
        };
    }
    Object.defineProperty(View.prototype, "left", {
        get: function () {
            return this._x - ((this.parent && this.parent.x) || 0);
        },
        set: function (value) {
            this._x = Math.ceil(((this.parent && this.parent.x) || 0) + value);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(View.prototype, "top", {
        get: function () {
            return this._y - (this.parent && this.parent.y) || 0;
        },
        set: function (value) {
            this._y = Math.ceil(((this.parent && this.parent.y) || 0) + value);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(View.prototype, "x", {
        get: function () {
            return this._x;
        },
        set: function (value) {
            var x = this._x;
            if (typeof value === "number" && !isNaN(value) && x !== value) {
                if (!this.dirty) {
                    this.lastX = x;
                }
                this._x = Math.ceil(value);
                var difference = x - this.lastX;
                for (var index = 0; index < this.children.length; index++) {
                    this.children[index].x += difference;
                }
                this.dirty = true;
            }
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(View.prototype, "y", {
        get: function () {
            return this._y;
        },
        set: function (value) {
            var y = this._y;
            if (typeof value === "number" && !isNaN(value) && y !== value) {
                if (!this.dirty) {
                    this.lastY = y;
                }
                this._y = Math.ceil(value);
                var difference = y - this.lastY;
                for (var index = 0; index < this.children.length; index++) {
                    this.children[index].y += difference;
                }
                this.dirty = true;
            }
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(View.prototype, "width", {
        get: function () {
            return this._width;
        },
        set: function (value) {
            var width = this._width;
            if (typeof value === "number" && !isNaN(value) && value !== width) {
                if (!this.dirty) {
                    this.lastWidth = width;
                }
                this._width = Math.ceil(value);
                this.dirty = true;
            }
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(View.prototype, "height", {
        get: function () {
            return this._height;
        },
        set: function (value) {
            var height = this._height;
            if (typeof value === "number" && !isNaN(value) && value !== height) {
                if (!this.dirty) {
                    this.lastHeight = height;
                }
                this._height = Math.ceil(value);
                this.dirty = true;
            }
        },
        enumerable: true,
        configurable: true
    });
    View.prototype.getObserversByType = function (type) {
        if (!this._observers[type]) {
            this._observers[type] = [];
        }
        return this._observers[type];
    };
    View.prototype.insertBeforeChild = function (view, referenceView) {
        var children = this.children;
        if (!(view instanceof View) || !(referenceView instanceof View)) {
            throw new Error("Child views need to be a view.");
        }
        var referenceIndex = children.indexOf(referenceView);
        if (referenceIndex === -1) {
            throw new Error("Couldn't find reference view.");
        }
        view.parent = this;
        children.splice(referenceIndex, 0, view);
        view.left = view.left;
        view.top = view.top;
        this.dirty = true;
        this.addedChildMutationEvent.child = view;
        this.notify(this.addedChildMutationEvent);
    };
    View.prototype.appendChild = function (view) {
        var children = this.children;
        if (!(view instanceof View)) {
            throw new Error("Child views need to be a view.");
        }
        view.parent = this;
        children.push(view);
        // This will accurately assign the positions of the children.
        view.left = view.left;
        view.top = view.top;
        this.dirty = true;
        this.addedChildMutationEvent.child = view;
        this.notify(this.addedChildMutationEvent);
    };
    View.prototype.removeChild = function (view) {
        var children = this.children;
        if (!(view instanceof View)) {
            throw new Error("Child views need to be a view.");
        }
        var referenceIndex = children.indexOf(view);
        if (referenceIndex === -1) {
            throw new Error("Couldn't find reference view.");
        }
        view.parent = this;
        children.splice(referenceIndex, 1);
        view.left = view.left;
        view.top = view.top;
        this.dirty = true;
        this.removedChildMutationEvent.child = view;
        this.notify(this.removedChildMutationEvent);
    };
    View.prototype.update = function (delta) {
        var behaviors = this.behaviors;
        var children = this.children;
        for (var index = 0; index < behaviors.length; index++) {
            if (typeof behaviors[index].update === "function") {
                behaviors[index].update(delta);
            }
        }
        for (index = 0; index < children.length; index++) {
            children[index].update(delta);
        }
    };
    View.prototype.draw = function (context, viewRect) {
        var behaviors = this.behaviors;
        var children = this.children;
        var intersection = Rect.getIntersection(this, viewRect);
        for (var index = 0; index < behaviors.length; index++) {
            if (intersection) {
                context.save();
                if (typeof behaviors[index].draw === "function") {
                    behaviors[index].draw(context, viewRect);
                }
                context.restore();
            }
        }
        for (index = 0; index < children.length; index++) {
            children[index].draw(context, viewRect);
        }
        this.lastX = this.x;
        this.lastY = this.y;
        this.lastWidth = this.width;
        this.lastHeight = this.height;
        this.dirty = false;
    };
    View.prototype.addBehavior = function (behavior) {
        if (typeof behavior.addedToView === "function") {
            behavior.addedToView(this);
        }
        if (typeof behavior.onStart === "function") {
            behavior.onStart();
        }
        this.behaviors.push(behavior);
        this.addedBehaviorEvent.behavior = behavior;
        this.notify(this.addedBehaviorEvent);
    };
    View.prototype.removeBehavior = function (behavior) {
        var indexOf = this.behaviors.indexOf(behavior);
        if (indexOf > -1) {
            if (typeof behavior.removedFromView === "function") {
                behavior.removedFromView(this);
            }
            if (typeof behavior.onEnd === "function") {
                behavior.onEnd();
            }
            this.behaviors.splice(indexOf, 1);
            this.removedBehaviorEvent.behavior = behavior;
            this.notify(this.removedBehaviorEvent);
        }
    };
    View.prototype.getBehaviors = function (Type) {
        return this.behaviors.filter(function (behavior) {
            return behavior.constructor === Type;
        });
    };
    View.prototype.observe = function (type, callback) {
        var observers = this.getObserversByType(type);
        var disposer = function () {
            var index = observers.indexOf(observer);
            if (index >= 0) {
                observers.splice(index, 1);
            }
        };
        var observer = new Observer(callback, disposer);
        observers.push(observer);
    };
    View.prototype.notify = function (event) {
        var type = event.type;
        if (type) {
            var observers = this.getObserversByType(type);
            observers.forEach(function (observer) {
                observer.notify(event);
            });
        }
        if (this.parent) {
            this.parent.notify(event);
        }
    };
    View.prototype.filter = function (filterCallback) {
        var results = [this].filter(filterCallback);
        return this.children.reduce(function (accumulated, child) {
            accumulated.concat(child.filter(filterCallback));
            return accumulated;
        }, results);
    };
    return View;
}());
module.exports = View;
//# sourceMappingURL=View.js.map