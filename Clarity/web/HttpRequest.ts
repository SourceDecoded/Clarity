import Future = require("../async/Future");

var isSuccessfulRequest = (xhr) => {
    return (xhr.status < 300 && xhr.status >= 200) || (xhr.status === 0 && xhr.responseText);
};

var global = (() => {
    return this;
})();

class HttpRequest {
    private url;
    private options;
    private state;
    private responseFuture;
    private asyncResponseFuture;
    private method;
    private body;
    private headers;

    constructor(url, options?) {
        this.options = options || {};

        this.state;
        this.responseFuture = null;
        this.asyncResponseFuture = null;
        this.method = options.method || "GET";
        this.body = options.data || options.body || null;
        this.headers = options.headers || {};
    
        // This helps ie browsers go to the proxy instead of a cross domain site.
        this.url = global.XDomainRequest ? options.proxyUrl || url : url;

        var throwSentError = () => {
            throw new Error("Request already sent.");
        };

        var defaultState = {
            sendAsync: () => {
                var xhr = new XMLHttpRequest();

                this.asyncResponseFuture = new Future((setValue, setError) => {
                    this.state = sentState;
                    xhr.onreadystatechange = (event) => {
                        if (xhr.readyState == 4) {
                            this.state = completeState;

                            if (isSuccessfulRequest(xhr)) {
                                setValue(xhr);
                            } else {
                                setError(xhr);
                            }
                        }
                    };

                    try {

                        xhr.open(this.method, url, true);
                        Object.keys(this.headers).forEach((key) => {
                            if (this.headers[key] !== false) {
                                xhr.setRequestHeader(key, this.headers[key]);
                            }
                        });

                        xhr.send(this.body);
                    } catch (e) {
                        setError(xhr);
                    }
                });

                this.asyncResponseFuture.ifCanceled(() => {
                    xhr.abort();
                });

                return this.asyncResponseFuture;
            },
            send: () => {
                return defaultState.sendAsync().chain((xhr) => {
                    return xhr.responseText;
                })["catch"]((xhr) => {
                    var error = <any>new Error("Request Error");
                    error.status = xhr.status;
                    error.statusText = xhr.statusText;
                    error.responseBody = xhr.responseBody;
                    error.xhr = xhr;
                    return Future.fromError(error);
                });
            },
            setHeader: (name, value) => {
                if (typeof name === "string" && typeof value === "string") {
                    this.headers[name] = value;
                } else {
                    throw new Error("Name and value need to be strings.");
                }
            },
            setHeaders: (headers) => {
                Object.keys(headers).forEach((key) => {
                    defaultState.setHeader(key, headers[key]);
                });
            },
            setBody: (value) => {
                if (typeof value === "string") {
                    this.body = value;
                }
            },
            setMethod: (value) => {
                this.method = value;
            }
        };

        var sentState = {
            sendAsync: () => {
                return this.asyncResponseFuture;
            },
            send: () => {
                return this.responseFuture;
            },
            setHeader: throwSentError,
            setHeaders: throwSentError,
            setBody: throwSentError,
            setMethod: throwSentError
        };

        var completeState = sentState;
        this.state = defaultState;
    }

    send() {
        return this.state.send();
    }

    sendAsync() {
        return this.state.sendAsync();
    }

    setHeader(name, value) {
        return this.state.setHeader.apply(this.state, arguments);
    }

    setHeaders(headers) {
        return this.state.setHeaders.apply(this.state, arguments);
    }

    setBody(data) {
        return this.state.setBody.apply(this.state, arguments);
    }

    setMethod(methodName) {
        return this.state.setMethod.apply(this.state, arguments);
    }
}

export = HttpRequest;