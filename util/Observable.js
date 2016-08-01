"use strict";
var Observer = require("./Observer");
var Observable = (function () {
    function Observable() {
        this.observers = [];
    }
    Observable.prototype.getObservers = function () {
        return this.observers;
    };
    ;
    Observable.prototype.observe = function () {
        var _this = this;
        var observer = new Observer(function () {
            var index = _this.observers.indexOf(observer);
            if (index >= 0) {
                _this.observers.splice(index, 1);
            }
        });
        this.observers.push(observer);
        return observer;
    };
    ;
    Observable.prototype.observeType = function (type, callback) {
        var _this = this;
        var observer = new Observer(function () {
            var index = _this.observers.indexOf(observer);
            if (index >= 0) {
                _this.observers.splice(index, 1);
            }
        });
        var modifiedObserver = observer.filter(function (event) {
            if (typeof event.type !== "undefined" && event.type === type) {
                return true;
            }
            return false;
        }).onEach(callback);
        this.observers.push(observer);
        return modifiedObserver;
    };
    ;
    Observable.prototype.notify = function (e) {
        this.observers.slice(0).forEach(function (observer) {
            observer.notify(e);
        });
    };
    ;
    return Observable;
}());
;
module.exports = Observable;
//# sourceMappingURL=Observable.js.map