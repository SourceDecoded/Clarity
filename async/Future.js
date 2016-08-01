/*
* Because Futures are used with such frequency we needed to optimize them. One of the ways
* that we did that was by making all the futures share the same state objects, and pass the future
* as the first parameter to every function so the state objects knows what future to act on.
* This was a tremendous memory gain, there was 15 times less memory in use with the new model
* on an empty future.
*/
"use strict";
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
    try(future) {
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
                }
                else {
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
                }
                else {
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
                }
                else {
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
    handleSetError: (future, error) => {
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
    handleSetValue: (future, value) => {
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
class Future {
    constructor(getValue) {
        this.state = initialState;
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
    try() {
        return this.state.try(this);
    }
    ifCanceled(callback) {
        if (typeof callback !== "function") {
            throw new Error("The callback must be a function");
        }
        return this.state.ifCanceled(this, callback);
    }
    cancel(reason = "Unknown") {
        return this.state.cancel(this, reason);
    }
    then(callback) {
        if (typeof callback !== "function") {
            callback = () => { };
        }
        this["try"]();
        return this.state.then(this, callback);
    }
    catch(callback) {
        if (typeof callback !== "function") {
            throw new Error("The callback must be a function");
        }
        return this.state.catch(this, callback);
    }
    catchCanceled(callback) {
        if (typeof callback !== "function") {
            throw new Error("The callback must be a function");
        }
        return this.state.catchCanceled(this, callback);
    }
    chain(callback) {
        if (typeof callback !== "function") {
            throw new Error("The callback must be a function");
        }
        return this.state.chain(this, callback);
    }
    ifError(callback) {
        if (typeof callback !== "function") {
            throw new Error("The callback must be a function");
        }
        return this.state.ifError(this, callback);
    }
    finally(callback) {
        if (typeof callback !== "function") {
            throw new Error("The callback must be a function");
        }
        return this.state.finally(this, callback);
    }
    setTimeout(milliseconds) {
        setTimeout(() => {
            this.cancel(timeOutText);
        }, milliseconds);
        return this;
    }
    ifTimedOut(callback) {
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
    onComplete() {
        this.finally.apply(this, arguments);
    }
    /**
     * Class methods.
     */
    static fromResult(value) {
        return new Future(resolve => {
            resolve(value);
        }).try();
    }
    static fromError(error) {
        return new Future((setValue, setError) => {
            setError(error);
        }).try();
    }
    static fromCanceled(reason) {
        const future = new Future(() => { });
        future.cancel(reason);
        return future;
    }
    static all(futures) {
        var length = futures.length;
        var results = new Array(length);
        futures = futures.map(value => {
            if (value instanceof Future) {
                return value;
            }
            else {
                return Future.fromResult(value);
            }
        });
        var future = new Future((setValue, setError, cancel) => {
            var doneCount = 0;
            if (futures.length === 0) {
                setValue([]);
            }
            else {
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
module.exports = Future;
//# sourceMappingURL=Future.js.map