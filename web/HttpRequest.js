var _this = this;
var Future = require("../async/Future");
var isSuccessfulRequest = function (xhr) {
    return (xhr.status < 300 && xhr.status >= 200) || (xhr.status === 0 && xhr.responseText);
};
var global = (function () {
    return _this;
})();
var HttpRequest = (function () {
    function HttpRequest(url, options) {
        var _this = this;
        this.options = options || {};
        this.state;
        this.responseFuture = null;
        this.asyncResponseFuture = null;
        this.method = options.method || "GET";
        this.body = options.data || options.body || null;
        this.headers = options.headers || {};
        // This helps ie browsers go to the proxy instead of a cross domain site.
        this.url = global.XDomainRequest ? options.proxyUrl || url : url;
        var throwSentError = function () {
            throw new Error("Request already sent.");
        };
        var defaultState = {
            sendAsync: function () {
                var xhr = new XMLHttpRequest();
                _this.asyncResponseFuture = new Future(function (setValue, setError) {
                    _this.state = sentState;
                    xhr.onreadystatechange = function (event) {
                        if (xhr.readyState == 4) {
                            _this.state = completeState;
                            if (isSuccessfulRequest(xhr)) {
                                setValue(xhr);
                            }
                            else {
                                setError(xhr);
                            }
                        }
                    };
                    try {
                        xhr.open(_this.method, url, true);
                        Object.keys(_this.headers).forEach(function (key) {
                            if (_this.headers[key] !== false) {
                                xhr.setRequestHeader(key, _this.headers[key]);
                            }
                        });
                        xhr.send(_this.body);
                    }
                    catch (e) {
                        setError(xhr);
                    }
                });
                _this.asyncResponseFuture.ifCanceled(function () {
                    xhr.abort();
                });
                return _this.asyncResponseFuture;
            },
            send: function () {
                return defaultState.sendAsync().chain(function (xhr) {
                    return xhr.responseText;
                })["catch"](function (xhr) {
                    var error = new Error("Request Error");
                    error.status = xhr.status;
                    error.statusText = xhr.statusText;
                    error.responseBody = xhr.responseBody;
                    error.xhr = xhr;
                    return Future.fromError(error);
                });
            },
            setHeader: function (name, value) {
                if (typeof name === "string" && typeof value === "string") {
                    _this.headers[name] = value;
                }
                else {
                    throw new Error("Name and value need to be strings.");
                }
            },
            setHeaders: function (headers) {
                Object.keys(headers).forEach(function (key) {
                    defaultState.setHeader(key, headers[key]);
                });
            },
            setBody: function (value) {
                if (typeof value === "string") {
                    _this.body = value;
                }
            },
            setMethod: function (value) {
                _this.method = value;
            }
        };
        var sentState = {
            sendAsync: function () {
                return _this.asyncResponseFuture;
            },
            send: function () {
                return _this.responseFuture;
            },
            setHeader: throwSentError,
            setHeaders: throwSentError,
            setBody: throwSentError,
            setMethod: throwSentError
        };
        var completeState = sentState;
        this.state = defaultState;
    }
    HttpRequest.prototype.send = function () {
        return this.state.send();
    };
    HttpRequest.prototype.sendAsync = function () {
        return this.state.sendAsync();
    };
    HttpRequest.prototype.setHeader = function (name, value) {
        return this.state.setHeader.apply(this.state, arguments);
    };
    HttpRequest.prototype.setHeaders = function (headers) {
        return this.state.setHeaders.apply(this.state, arguments);
    };
    HttpRequest.prototype.setBody = function (data) {
        return this.state.setBody.apply(this.state, arguments);
    };
    HttpRequest.prototype.setMethod = function (methodName) {
        return this.state.setMethod.apply(this.state, arguments);
    };
    return HttpRequest;
})();
module.exports = HttpRequest;
//# sourceMappingURL=HttpRequest.js.map