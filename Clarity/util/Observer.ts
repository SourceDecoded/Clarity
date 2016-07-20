class Observer {
    private _onEach: (e: any) => void;
    private _onError: (e: any) => void;
    private _unbind: () => void;
    private _filter: (e: any) => void;
    private _map: (e: any) => void;
    private _observers: Observer[];
    private emptyFn = () => { };
    private returnTrue = () => { return true; };
    private returnItem = (item) => { return item; };
    private _state: any;
    private disposedState: any;

    constructor(unbind?, filter?, map?) {
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

        var dispose = () => {
            this._unbind();
            this._state = disposedState;
        }

        var defaultState = {
            stop: () => {
                this._state = stoppedState;
            },
            start: this.emptyFn,
            notify: (e) => {

                if (this._filter(e)) {

                    var value = this._map(e);

                    this._onEach(value);

                    this._observers.slice(0).forEach(function (observer) {
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

    notify(e) {
        this._state.notify(e);
    };

    copy() {
        return this.filter(function () { return true; });
    };

    stop() {
        this._state.stop();
    };

    start() {
        this._state.start();
    };

    dispose() {
        this._state.dispose();
    };

    filter(filter) {
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

    map(map) {
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

    onEach(callback) {
        var self = this;
        if (typeof callback !== "function") {
            throw new Error("Expected a function.");
        }

        self._onEach = callback;
        return self;
    };

    onError(callback) {
        var self = this;
        self._onError = callback;
        return self;
    };
}


export = Observer;