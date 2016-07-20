/*
* Because Futures are used with such frequency we needed to optimize them. One of the ways
* that we did that was by making all the futures share the same state objects, and pass the future
* as the first parameter to every function so the state objects knows what future to act on.
* This was a tremendous memory gain, there was 15 times less memory in use with the new model
* on an empty future.
*/

var emptyFnReturnFuture = future => future;

var notifyFutureIsComplete = future => {
    future.callbacks["finally"].forEach(callback => {
        callback();
    });

    Object.keys(future.callbacks).forEach(type => {
        future.callbacks[type] = [];
    });
};

var invokeCallback = (future, callback) => {
    if (typeof callback === "function") {
        callback();
    }

    return future;
};

var initialState = {
    try(future: Future<any>) {
        future.state = retrievingState;
        const setValue = value => {
            future.state.handleSetValue(future, value);
        };
        const setError = error => {
            future.state.handleSetError(future, error);
        };
        const cancel = reason => future.cancel(reason);
        future.getValue(setValue, setError, cancel, callback => future.ifCanceled(callback));

        return future;
    },
    then(future, callback) {
        if (typeof callback === "function") {
            future.callbacks.then.push(callback);
        }
        return future;
    },
    catch(future, callback) {
        var wrappedFuture = new Future((setValue, setError, cancel, ifCanceled) => {

            future.ifError(error => {
                var nextFuture = callback(error);

                if (nextFuture instanceof Future) {
                    nextFuture.then(setValue);
                    nextFuture.ifError(setError);
                    nextFuture.ifCanceled(cancel);

                    ifCanceled(reason => {
                        nextFuture.cancel(reason);
                    });
                } else {
                    setValue(nextFuture);
                }
            });

            future.ifCanceled(cancel);
            future.then(setValue);

        });

        wrappedFuture.ifCanceled(() => {
            future.cancel();
        });

        return wrappedFuture;
    },
    catchCanceled(future, callback) {
        var wrappedFuture = new Future((setValue, setError, cancel, ifCanceled) => {

            future.ifCanceled(reason => {
                var nextFuture = callback(reason);

                if (nextFuture instanceof Future) {
                    nextFuture.then(setValue);
                    nextFuture.ifError(setError);
                    nextFuture.ifCanceled(cancel);

                    ifCanceled(reason => {
                        nextFuture.cancel(reason);
                    });
                } else {
                    setValue(nextFuture);
                }
            });

            future.then(setValue);
            future.ifError(setError);

        });

        wrappedFuture.ifCanceled(() => {
            future.cancel();
        });

        return wrappedFuture;

    },
    ifCanceled(future, callback) {
        future.callbacks.ifCanceled.push(callback);
        return future;
    },
    ifError(future, callback) {
        if (typeof callback === "function") {
            future.callbacks.ifError.push(callback);
        }
        return future;
    },
    chain(future, callback) {

        var wrappedFuture = new Future((resolve, reject, cancel, ifCanceled) => {
            future.then(value => {
                var nextFuture = callback(value);

                if (nextFuture instanceof Future) {
                    nextFuture.then(resolve);
                    nextFuture.ifError(reject);
                    nextFuture.ifCanceled(cancel);

                    ifCanceled(reason => {
                        nextFuture.cancel(reason);
                    });
                } else {
                    resolve(nextFuture);
                }
            });

            future.ifCanceled(cancel);
            future.ifError(reject);
        });

        wrappedFuture.ifCanceled(reason => {
            future.cancel(reason);
        });

        return wrappedFuture;
    },
    cancel(future, cancelationMessage) {
        future.isDone = true;
        future.isComplete = true;
        future.isCanceled = true;
        future.state = canceledState;
        future.cancelationMessage = cancelationMessage;
        future.callbacks.ifCanceled.forEach(callback => {
            callback(cancelationMessage);
        });
        notifyFutureIsComplete(future);
        return future;
    },
    finally(future, callback) {
        if (typeof callback === "function") {
            future.callbacks.finally.push(callback);
        }
        return future;
    },
    handleSetError: emptyFnReturnFuture,
    handleSetValue: emptyFnReturnFuture
};

var retrievingState = {
    try: emptyFnReturnFuture,
    then: initialState.then,
    catch: initialState["catch"],
    catchCanceled: initialState.catchCanceled,
    ifCanceled: initialState.ifCanceled,
    chain: initialState.chain,
    ifError: initialState.ifError,
    cancel: initialState.cancel,
    finally: initialState.finally,
    handleSetError: (future: Future<any>, error) => {
        if (future.state === retrievingState) {
            future.error = error;
            future.isDone = true;
            future.isComplete = true;
            future.state = errorState;

            future.callbacks["ifError"].forEach(callback => {
                callback(error);
            });
        }

        notifyFutureIsComplete(future);
    },
    handleSetValue: (future: Future<any>, value: any) => {
        if (future.state === retrievingState) {
            future.value = value;
            future.isDone = true;
            future.isComplete = true;

            future.state = doneState;

            future.callbacks.then.forEach(callback => {
                callback(value);
            });
        }

        notifyFutureIsComplete(future);
    }
};

var doneState = {
    try: emptyFnReturnFuture,
    then(future, callback) {
        callback(future.value);
        return future;
    },
    catch: initialState["catch"],
    ifError: emptyFnReturnFuture,
    catchCanceled: emptyFnReturnFuture,
    ifCanceled: emptyFnReturnFuture,
    chain: initialState.chain,
    cancel: emptyFnReturnFuture,
    finally: invokeCallback,
    handleSetError: emptyFnReturnFuture,
    handleSetValue: emptyFnReturnFuture
};

var errorState = {
    "try": emptyFnReturnFuture,
    then: emptyFnReturnFuture,
    "catch": initialState["catch"],
    ifError(future, callback) {
        callback(future.error);
        return future;
    },
    catchCanceled: emptyFnReturnFuture,
    ifCanceled: emptyFnReturnFuture,
    chain: initialState.chain,
    cancel: emptyFnReturnFuture,
    "finally": invokeCallback,
    handleSetError: emptyFnReturnFuture,
    handleSetValue: emptyFnReturnFuture
};

var canceledState = {
    "try": emptyFnReturnFuture,
    then: emptyFnReturnFuture,
    "catch": initialState["catch"],
    catchCanceled: initialState.catchCanceled,
    ifCanceled(future, callback) {
        callback(future.cancelationMessage);
        return future;
    },
    ifError: emptyFnReturnFuture,
    chain: initialState.chain,
    cancel: emptyFnReturnFuture,
    "finally": invokeCallback,
    handleSetError: emptyFnReturnFuture,
    handleSetValue: emptyFnReturnFuture
};

const timeOutText = "Timed out.";

class Future<T> {

    state: any = initialState;
    value: T;
    isDone: boolean;
    isComplete: boolean;
    error: any;
    cancelationMessage: string;
    getValue: {
        (
            resolve: (value: T) => void,
            reject: (value: T) => void,
            cancel: (reason: string) => void,
            ifCanceled: (callback: (reason: string) => void) => Future<T>
        ): void;
    }

    callbacks: {
        finally: {
            (callback: () => void): void;
        }[];
        chain: {
            (callback: (value: T) => Future<any>): Future<T>;
        }[];
        ifCanceled: {
            (callback: (reason: string) => Future<any>): Future<T>;
        }[];
        then: {
            (callback: (value: T) => Future<any>): Future<T>;
        }[];
        ifError: {
            (callback: (error: any) => Future<any>): Future<T>;
        }[];
    }



    constructor(getValue?: (
        resolve: (value: T) => void,
        reject: (error: any) => void,
        cancel: (reason: string) => void,
        ifCanceled: (callback: (reason: string) => void) => Future<T>
    ) => void) {

        this.callbacks = {
            finally: [],
            chain: [],
            ifCanceled: [],
            then: [],
            ifError: []
        };

        this.value = null;
        this.error = null;
        this.isDone = false;
        this.cancelationMessage = null;
        this.getValue = getValue;
        this.state = initialState;

        if (typeof this.getValue !== "function") {
            this.getValue = emptyFnReturnFuture;
        }
    }

    public try() {
        return this.state.try(this);
    }

    public ifCanceled(callback) {
        if (typeof callback !== "function") {
            throw new Error("The callback must be a function");
        }
        return this.state.ifCanceled(this, callback);
    }

    public cancel(reason: string = "Unknown") {
        return this.state.cancel(this, reason);
    }

    public then(callback) {
        if (typeof callback !== "function") {
            callback = () => { };
        }
        this["try"]();
        return this.state.then(this, callback);
    }

    public catch(callback) {
        if (typeof callback !== "function") {
            throw new Error("The callback must be a function");
        }
        return this.state.catch(this, callback);
    }

    public catchCanceled(callback) {
        if (typeof callback !== "function") {
            throw new Error("The callback must be a function");
        }
        return this.state.catchCanceled(this, callback);
    }

    public chain(callback) {
        if (typeof callback !== "function") {
            throw new Error("The callback must be a function");
        }
        return this.state.chain(this, callback);
    }

    public ifError(callback) {
        if (typeof callback !== "function") {
            throw new Error("The callback must be a function");
        }
        return this.state.ifError(this, callback);
    }

    public finally(callback) {
        if (typeof callback !== "function") {
            throw new Error("The callback must be a function");
        }
        return this.state.finally(this, callback);
    }

    public setTimeout(milliseconds) {
        setTimeout(() => {
            this.cancel(timeOutText);
        }, milliseconds);
        return this;
    }

    public ifTimedOut(callback) {
        if (typeof callback !== "function") {
            throw new Error("The callback must be a function");
        }
        this.ifCanceled(reason => {
            if (reason === timeOutText) {
                callback();
            }
        });
        return this;
    }

    public onComplete() {
        this.finally.apply(this, arguments);
    }

    /**
     * Class methods.
     */

    public static fromResult<T>(value?: T): Future<T> {
        return new Future<T>(resolve => {
            resolve(value);
        }).try();
    }

    public static fromError<T>(error?: any) {
        return new Future<T>((setValue, setError) => {
            setError(error);
        }).try();
    }

    public static fromCanceled<T>(reason?: string) {
        const future = new Future<T>(() => { });
        future.cancel(reason);
        return future;
    }

    public static all(futures: any[]) {
        var length = futures.length;
        var results = new Array(length);

        futures = futures.map(value => {
            if (value instanceof Future) {
                return value;
            } else {
                return Future.fromResult(value);
            }
        });

        var future = new Future<Array<any>>((setValue, setError, cancel) => {
            var doneCount = 0;

            if (futures.length === 0) {
                setValue([]);
            } else {
                futures.forEach((future, index) => {
                    future.then(value => {
                        results[index] = value;
                        doneCount++;
                        if (doneCount === length) {
                            setValue(results);
                        }
                    }).ifError(e => {

                        setError(e);
                    }).ifCanceled(cancel);
                });
            }
        });

        return future;
    }
}

export = Future;