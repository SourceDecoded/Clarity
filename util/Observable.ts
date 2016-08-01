import Observer = require("./Observer");

class Observable {
    observers: Observer[]
    constructor() {
        this.observers = [];
    }

    getObservers() {
        return this.observers;
    };

    observe() {
        var observer = new Observer(() => {
            var index = this.observers.indexOf(observer);
            if (index >= 0) {
                this.observers.splice(index, 1);
            }
        });
        this.observers.push(observer);
        return observer;
    };

    observeType(type, callback) {

        var observer = new Observer(() =>  {
            var index = this.observers.indexOf(observer);
            if (index >= 0) {
                this.observers.splice(index, 1);
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

    notify(e) {
        this.observers.slice(0).forEach(function (observer) {
            observer.notify(e);
        });
    };
};

export = Observable;
