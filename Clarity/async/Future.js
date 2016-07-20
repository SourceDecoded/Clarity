/*
* Because Futures are used with such frequency we needed to optimize them. One of the ways
* that we did that was by making all the futures share the same state objects, and pass the future
* as the first parameter to every function so the state objects knows what future to act on.
* This was a tremendous memory gain, there was 15 times less memory in use with the new model
* on an empty future.
*/
"use strict";
var emptyFnReturnFuture = function (future) { return future; };
var notifyFutureIsComplete = function (future) {
    future.callbacks["finally"].forEach(function (callback) {
        callback();
    });
    Object.keys(future.callbacks).forEach(function (type) {
        future.callbacks[type] = [];
    });
};
var invokeCallback = function (future, callback) {
    if (typeof callback === "function") {
        callback();
    }
    return future;
};
var initialState = {
    try: function (future) {
        future.state = retrievingState;
        var setValue = function (value) {
            future.state.handleSetValue(future, value);
        };
        var setError = function (error) {
            future.state.handleSetError(future, error);
        };
        var cancel = function (reason) { return future.cancel(reason); };
        future.getValue(setValue, setError, cancel, function (callback) { return future.ifCanceled(callback); });
        return future;
    },
    then: function (future, callback) {
        if (typeof callback === "function") {
            future.callbacks.then.push(callback);
        }
        return future;
    },
    catch: function (future, callback) {
        var wrappedFuture = new Future(function (setValue, setError, cancel, ifCanceled) {
            future.ifError(function (error) {
                var nextFuture = callback(error);
                if (nextFuture instanceof Future) {
                    nextFuture.then(setValue);
                    nextFuture.ifError(setError);
                    nextFuture.ifCanceled(cancel);
                    ifCanceled(function (reason) {
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
        wrappedFuture.ifCanceled(function () {
            future.cancel();
        });
        return wrappedFuture;
    },
    catchCanceled: function (future, callback) {
        var wrappedFuture = new Future(function (setValue, setError, cancel, ifCanceled) {
            future.ifCanceled(function (reason) {
                var nextFuture = callback(reason);
                if (nextFuture instanceof Future) {
                    nextFuture.then(setValue);
                    nextFuture.ifError(setError);
                    nextFuture.ifCanceled(cancel);
                    ifCanceled(function (reason) {
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
        wrappedFuture.ifCanceled(function () {
            future.cancel();
        });
        return wrappedFuture;
    },
    ifCanceled: function (future, callback) {
        future.callbacks.ifCanceled.push(callback);
        return future;
    },
    ifError: function (future, callback) {
        if (typeof callback === "function") {
            future.callbacks.ifError.push(callback);
        }
        return future;
    },
    chain: function (future, callback) {
        var wrappedFuture = new Future(function (resolve, reject, cancel, ifCanceled) {
            future.then(function (value) {
                var nextFuture = callback(value);
                if (nextFuture instanceof Future) {
                    nextFuture.then(resolve);
                    nextFuture.ifError(reject);
                    nextFuture.ifCanceled(cancel);
                    ifCanceled(function (reason) {
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
        wrappedFuture.ifCanceled(function (reason) {
            future.cancel(reason);
        });
        return wrappedFuture;
    },
    cancel: function (future, cancelationMessage) {
        future.isDone = true;
        future.isComplete = true;
        future.isCanceled = true;
        future.state = canceledState;
        future.cancelationMessage = cancelationMessage;
        future.callbacks.ifCanceled.forEach(function (callback) {
            callback(cancelationMessage);
        });
        notifyFutureIsComplete(future);
        return future;
    },
    finally: function (future, callback) {
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
    handleSetError: function (future, error) {
        if (future.state === retrievingState) {
            future.error = error;
            future.isDone = true;
            future.isComplete = true;
            future.state = errorState;
            future.callbacks["ifError"].forEach(function (callback) {
                callback(error);
            });
        }
        notifyFutureIsComplete(future);
    },
    handleSetValue: function (future, value) {
        if (future.state === retrievingState) {
            future.value = value;
            future.isDone = true;
            future.isComplete = true;
            future.state = doneState;
            future.callbacks.then.forEach(function (callback) {
                callback(value);
            });
        }
        notifyFutureIsComplete(future);
    }
};
var doneState = {
    try: emptyFnReturnFuture,
    then: function (future, callback) {
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
    ifError: function (future, callback) {
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
    ifCanceled: function (future, callback) {
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
var timeOutText = "Timed out.";
var Future = (function () {
    function Future(getValue) {
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
    Future.prototype.try = function () {
        return this.state.try(this);
    };
    Future.prototype.ifCanceled = function (callback) {
        if (typeof callback !== "function") {
            throw new Error("The callback must be a function");
        }
        return this.state.ifCanceled(this, callback);
    };
    Future.prototype.cancel = function (reason) {
        if (reason === void 0) { reason = "Unknown"; }
        return this.state.cancel(this, reason);
    };
    Future.prototype.then = function (callback) {
        if (typeof callback !== "function") {
            callback = function () { };
        }
        this["try"]();
        return this.state.then(this, callback);
    };
    Future.prototype.catch = function (callback) {
        if (typeof callback !== "function") {
            throw new Error("The callback must be a function");
        }
        return this.state.catch(this, callback);
    };
    Future.prototype.catchCanceled = function (callback) {
        if (typeof callback !== "function") {
            throw new Error("The callback must be a function");
        }
        return this.state.catchCanceled(this, callback);
    };
    Future.prototype.chain = function (callback) {
        if (typeof callback !== "function") {
            throw new Error("The callback must be a function");
        }
        return this.state.chain(this, callback);
    };
    Future.prototype.ifError = function (callback) {
        if (typeof callback !== "function") {
            throw new Error("The callback must be a function");
        }
        return this.state.ifError(this, callback);
    };
    Future.prototype.finally = function (callback) {
        if (typeof callback !== "function") {
            throw new Error("The callback must be a function");
        }
        return this.state.finally(this, callback);
    };
    Future.prototype.setTimeout = function (milliseconds) {
        var _this = this;
        setTimeout(function () {
            _this.cancel(timeOutText);
        }, milliseconds);
        return this;
    };
    Future.prototype.ifTimedOut = function (callback) {
        if (typeof callback !== "function") {
            throw new Error("The callback must be a function");
        }
        this.ifCanceled(function (reason) {
            if (reason === timeOutText) {
                callback();
            }
        });
        return this;
    };
    Future.prototype.onComplete = function () {
        this.finally.apply(this, arguments);
    };
    /**
     * Class methods.
     */
    Future.fromResult = function (value) {
        return new Future(function (resolve) {
            resolve(value);
        }).try();
    };
    Future.fromError = function (error) {
        return new Future(function (setValue, setError) {
            setError(error);
        }).try();
    };
    Future.fromCanceled = function (reason) {
        var future = new Future(function () { });
        future.cancel(reason);
        return future;
    };
    Future.all = function (futures) {
        var length = futures.length;
        var results = new Array(length);
        futures = futures.map(function (value) {
            if (value instanceof Future) {
                return value;
            }
            else {
                return Future.fromResult(value);
            }
        });
        var future = new Future(function (setValue, setError, cancel) {
            var doneCount = 0;
            if (futures.length === 0) {
                setValue([]);
            }
            else {
                futures.forEach(function (future, index) {
                    future.then(function (value) {
                        results[index] = value;
                        doneCount++;
                        if (doneCount === length) {
                            setValue(results);
                        }
                    }).ifError(function (e) {
                        setError(e);
                    }).ifCanceled(cancel);
                });
            }
        });
        return future;
    };
    return Future;
}());
module.exports = Future;
//# sourceMappingURL=Future.js.map