"use strict";
var Observer = (function () {
    function Observer(unbind, filter, map) {
        var _this = this;
        this.emptyFn = function () { };
        this.returnTrue = function () { return true; };
        this.returnItem = function (item) { return item; };
        this._onEach = this.emptyFn;
        this._onError = this.emptyFn;
        this._observers = [];
        this._unbind = unbind || this.emptyFn;
        this._filter = filter || this.returnTrue;
        this._map = map || this.returnItem;
        if (typeof this._filter !== "function") {
            throw new TypeError("Expected a function.");
        }
        if (typeof this._map !== "function") {
            throw new TypeError("Expected a function.");
        }
        var dispose = function () {
            _this._unbind();
            _this._state = disposedState;
        };
        var defaultState = {
            stop: function () {
                _this._state = stoppedState;
            },
            start: this.emptyFn,
            notify: function (e) {
                if (_this._filter(e)) {
                    var value = _this._map(e);
                    _this._onEach(value);
                    _this._observers.slice(0).forEach(function (observer) {
                        observer.notify(value);
                    });
                }
            },
            dispose: this.dispose
        };
        var disposedState = {
            stop: this.emptyFn,
            start: this.emptyFn,
            notify: this.emptyFn,
            dispose: this.emptyFn
        };
        var stoppedState = {
            stop: this.emptyFn,
            start: function () {
                this._state = defaultState;
            },
            notify: this.emptyFn,
            dispose: this.emptyFn
        };
        this._state = defaultState;
    }
    Observer.prototype.notify = function (e) {
        this._state.notify(e);
    };
    ;
    Observer.prototype.copy = function () {
        return this.filter(function () { return true; });
    };
    ;
    Observer.prototype.stop = function () {
        this._state.stop();
    };
    ;
    Observer.prototype.start = function () {
        this._state.start();
    };
    ;
    Observer.prototype.dispose = function () {
        this._state.dispose();
    };
    ;
    Observer.prototype.filter = function (filter) {
        var self = this;
        if (typeof filter !== "function") {
            throw new Error("Filter needs to be a function.");
        }
        var observer = new Observer(function () {
            var index = this._observers.indexOf(observer);
            if (index >= 0) {
                self._observers.splice(index, 1);
            }
        }, filter);
        self._observers.push(observer);
        return observer;
    };
    ;
    Observer.prototype.map = function (map) {
        var self = this;
        var observer = new Observer(function () {
            var index = self._observers.indexOf(observer);
            if (index >= 0) {
                self._observers.splice(index, 1);
            }
        }, undefined, map);
        self._observers.push(observer);
        return observer;
    };
    ;
    Observer.prototype.onEach = function (callback) {
        var self = this;
        if (typeof callback !== "function") {
            throw new Error("Expected a function.");
        }
        self._onEach = callback;
        return self;
    };
    ;
    Observer.prototype.onError = function (callback) {
        var self = this;
        self._onError = callback;
        return self;
    };
    ;
    return Observer;
}());
module.exports = Observer;
//# sourceMappingURL=Observer.js.map