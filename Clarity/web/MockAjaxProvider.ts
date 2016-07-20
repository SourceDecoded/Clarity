import Future = require("../async/Future");

var returnValue = function (value) { return Future.fromResult(value); };
var returnError = function (value) { return Future.fromError(value); };

var makeFutureXhrResponseByStatusCode = function (xhr) {
    if (xhr.status < 300 && xhr.status >= 200) {
        return Future.fromResult(xhr);
    } else {
        return Future.fromError(xhr);
    }
};

class MockAjaxProvider {
    private defaultConfig;
    private globalHandler;
    private dataConverter;
    private stringPathHandlers;
    private regExPathHandlers;

    constructor(defaultConfig?) {
        this.defaultConfig = this.defaultConfig || {};
        this.defaultConfig.method = this.defaultConfig.method || "GET";
        this.globalHandler = this.defaultConfig.handler;

        this.dataConverter = this.defaultConfig.dataConverter || {
            handleResponseAsync: returnValue,
            handleRequestAsync: returnValue,
            handleErrorResponseAsync: returnError
        };

        this.stringPathHandlers = {};
        this.regExPathHandlers = [];
    }

    addResponseHandlerByMethod(methodName, handler) {
        if (typeof methodName !== "string") {
            throw new Error("The methodName needs to be a string.");
        }

        if (typeof handler !== "function") {
            throw new Error("The handler needs to be a function.");
        }

        methodHandlers[methodName] = handler;
    }

    addResponseHandlerByPath(pathRegExOrPathString, handler) {
        if (typeof pathRegExOrPathString !== "string" && !(pathRegExOrPathString instanceof RegExp)) {
            throw new Error("The methodName needs to be a string.");
        }

        if (typeof handler !== "function") {
            throw new Error("The handler needs to be a function.");
        }

        if (pathRegExOrPathString instanceof RegExp) {
            this.regExPathHandlers.push({
                regEx: pathRegExOrPathString,
                handler: handler
            });
        } else {
            this.stringPathHandlers[pathRegExOrPathString] = handler;
        }
    }

    request(url, config) {
        config = config || {};
        var x;
        var handler = this.globalHandler;
        var xhr;

        Object.keys(this.defaultConfig).forEach((key) => {
            if (typeof config[key] === "undefined") {
                config[key] = this.defaultConfig[key];
            }
        });

        config.url = url;

        return this.dataConverter.handleRequestAsync(config).chain(() => {
            handler = handler || this.stringPathHandlers[url];

            if (typeof handler === "function") {
                return makeFutureXhrResponseByStatusCode(handler(config));
            }

            for (x = 0; x < this.regExPathHandlers.length; x++) {
                var match = this.regExPathHandlers[x].regEx.test(url);
                if (match) {
                    return makeFutureXhrResponseByStatusCode(this.regExPathHandlers[x].handler(config));
                }
            }

            if (methodHandlers[config.method.toUpperCase() || "GET"]) {
                xhr = methodHandlers[config.method.toUpperCase()](config);

                return Future.fromError(xhr);
            }

            xhr = MockAjaxProvider.createErrorXhrResponse();

            return Future.fromError(xhr);

        }).chain((xhr) => {
            return this.dataConverter.handleResponseAsync(xhr);
        })["catch"]((error) => {
            return this.dataConverter.handleErrorResponseAsync(error);
        });
    }


    static createOKXhrResponse(responseText) {
        return {
            response: responseText,
            responseText: responseText,
            responseType: "text",
            status: 200,
            statusText: "200 OK"
        };
    };

    static createErrorXhrResponse() {
        return {
            response: "",
            responseText: "",
            responseType: "text",
            status: 0,
            statusText: "0 Network Error"
        };
    }

    static createCustomErrorXhrResponse(status, responseText) {
        return {
            response: responseText,
            responseText: responseText,
            responseType: "text",
            status: status,
            statusText: status + " Error"
        };
    }
}

var methodHandlers = {
    "GET": MockAjaxProvider.createErrorXhrResponse,
    "POST": MockAjaxProvider.createErrorXhrResponse,
    "PUT": MockAjaxProvider.createErrorXhrResponse,
    "PATCH": MockAjaxProvider.createErrorXhrResponse,
    "DELETE": MockAjaxProvider.createErrorXhrResponse
};



export = MockAjaxProvider;