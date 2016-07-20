import Observer = require("./Observer");
import Rect = require("./Rect");

class View {
    private _x: number;
    private _y: number;
    private _width: number;
    private _height: number;
    private _observers: {};

    id: string;

    // To save on memory only make one event type.
    addedChildMutationEvent;
    removedChildMutationEvent;
    addedBehaviorEvent;
    removedBehaviorEvent;

    lastX: number;
    lastY: number;
    lastWidth: number;
    lastHeight: number;
    dirty: boolean;
    children: View[];
    behaviors: any[];
    parent: View;
    services;

    get left() {
        return this._x - ((this.parent && this.parent.x) || 0);
    }

    set left(value: number) {
        this._x = Math.ceil(((this.parent && this.parent.x) || 0) + value);
    }

    get top() {
        return this._y - (this.parent && this.parent.y) || 0;
    }

    set top(value: number) {
        this._y = Math.ceil(((this.parent && this.parent.y) || 0) + value);
    }

    get x() {
        return this._x;
    }

    set x(value: number) {
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
    }

    get y() {
        return this._y;
    }

    set y(value: number) {
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
    }

    get width() {
        return this._width;
    }

    set width(value: number) {
        var width = this._width;
        if (typeof value === "number" && !isNaN(value) && value !== width) {
            if (!this.dirty) {
                this.lastWidth = width;
            }
            this._width = Math.ceil(value);
            this.dirty = true;
        }
    }

    get height() {
        return this._height;
    }

    set height(value: number) {
        var height = this._height;
        if (typeof value === "number" && !isNaN(value) && value !== height) {
            if (!this.dirty) {
                this.lastHeight = height;
            }
            this._height = Math.ceil(value);
            this.dirty = true;
        }
    }

    private getObserversByType(type) {
        if (!this._observers[type]) {
            this._observers[type] = [];
        }
        return this._observers[type];
    }

    constructor() {
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

    insertBeforeChild(view, referenceView) {
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
    }

    appendChild(view) {
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
    }

    removeChild(view) {
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
    }

    update(delta) {
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
    }

    draw(context, viewRect) {
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
    }

    addBehavior(behavior) {
        if (typeof behavior.addedToView === "function") {
            behavior.addedToView(this);
        }

        if (typeof behavior.onStart === "function") {
            behavior.onStart();
        }

        this.behaviors.push(behavior);

        this.addedBehaviorEvent.behavior = behavior;
        this.notify(this.addedBehaviorEvent);
    }

    removeBehavior(behavior) {
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
    }

    getBehaviors(Type: any) {
        return this.behaviors.filter((behavior) => {
            return behavior.constructor === Type;
        });
    }

    observe(type: string, callback: (event) => void) {
        var observers = this.getObserversByType(type);
        var disposer = () => {
            var index = observers.indexOf(observer);
            if (index >= 0) {
                observers.splice(index, 1);
            }
        };

        var observer = new Observer(callback, disposer);
        observers.push(observer);
    }

    notify(event) {
        var type = event.type;
        if (type) {
            var observers = this.getObserversByType(type);
            observers.forEach((observer) => {
                observer.notify(event);
            });
        }
        if (this.parent) {
            this.parent.notify(event);
        }
    }

    filter(filterCallback) {
        var results = [this].filter(filterCallback);

        return this.children.reduce((accumulated, child) => {
            accumulated.concat((<any>child).filter(filterCallback));
            return accumulated;
        }, results);
    }
}

export = View;


