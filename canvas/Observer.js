"use strict";
class Observer {
    constructor(callback, disposer) {
        this._isListening = true;
        this._callback = callback;
        this._disposer = disposer || function () { };
    }
    stop() {
        this._isListening = false;
    }
    start() {
        this._isListening = true;
    }
    notify(event) {
        if (this._isListening) {
            this._callback(event);
        }
    }
    dispose() {
        this._isListening = false;
        return this.dispose();
    }
}
module.exports = Observer;
//# sourceMappingURL=Observer.js.map