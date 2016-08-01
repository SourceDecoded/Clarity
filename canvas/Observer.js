"use strict";
var Observer = (function () {
    function Observer(callback, disposer) {
        this._isListening = true;
        this._callback = callback;
        this._disposer = disposer || function () { };
    }
    Observer.prototype.stop = function () {
        this._isListening = false;
    };
    Observer.prototype.start = function () {
        this._isListening = true;
    };
    Observer.prototype.notify = function (event) {
        if (this._isListening) {
            this._callback(event);
        }
    };
    Observer.prototype.dispose = function () {
        this._isListening = false;
        return this.dispose();
    };
    return Observer;
}());
module.exports = Observer;
//# sourceMappingURL=Observer.js.map