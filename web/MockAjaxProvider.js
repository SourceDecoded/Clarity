"use strict";
var Future = require("../async/Future");
var returnValue = function (value) { return Future.fromResult(value); };
var returnError = function (value) { return Future.fromError(value); };
var makeFutureXhrResponseByStatusCode = function (xhr) {
    if (xhr.status < 300 && xhr.status >= 200) {
        return Future.fromResult(xhr);
    }
    else {
        return Future.fromError(xhr);
    }
};
var MockAjaxProvider = (function () {
    function MockAjaxProvider(defaultConfig) {
        this.defaultConfig = defaultConfig || {};
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
    MockAjaxProvider.prototype.addResponseHandlerByMethod = function (methodName, handler) {
        if (typeof methodName !== "string") {
            throw new Error("The methodName needs to be a string.");
        }
        if (typeof handler !== "function") {
            throw new Error("The handler needs to be a function.");
        }
        methodHandlers[methodName] = handler;
    };
    MockAjaxProvider.prototype.addResponseHandlerByPath = function (pathRegExOrPathString, handler) {
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
        }
        else {
            this.stringPathHandlers[pathRegExOrPathString] = handler;
        }
    };
    MockAjaxProvider.prototype.request = function (url, config) {
        var _this = this;
        config = config || {};
        var x;
        var handler = this.globalHandler;
        var xhr;
        Object.keys(this.defaultConfig).forEach(function (key) {
            if (typeof config[key] === "undefined") {
                config[key] = _this.defaultConfig[key];
            }
        });
        config.url = url;
        return this.dataConverter.handleRequestAsync(config).chain(function () {
            handler = handler || _this.stringPathHandlers[url];
            if (typeof handler === "function") {
                return makeFutureXhrResponseByStatusCode(handler(config));
            }
            for (x = 0; x < _this.regExPathHandlers.length; x++) {
                var match = _this.regExPathHandlers[x].regEx.test(url);
                if (match) {
                    return makeFutureXhrResponseByStatusCode(_this.regExPathHandlers[x].handler(config));
                }
            }
            if (methodHandlers[config.method.toUpperCase() || "GET"]) {
                xhr = methodHandlers[config.method.toUpperCase()](config);
                return Future.fromError(xhr);
            }
            xhr = MockAjaxProvider.createErrorXhrResponse();
            return Future.fromError(xhr);
        }).chain(function (xhr) {
            return _this.dataConverter.handleResponseAsync(xhr);
        })["catch"](function (error) {
            return _this.dataConverter.handleErrorResponseAsync(error);
        });
    };
    MockAjaxProvider.createOKXhrResponse = function (responseText) {
        return {
            response: responseText,
            responseText: responseText,
            responseType: "text",
            status: 200,
            statusText: "200 OK"
        };
    };
    ;
    MockAjaxProvider.createErrorXhrResponse = function () {
        return {
            response: "",
            responseText: "",
            responseType: "text",
            status: 0,
            statusText: "0 Network Error"
        };
    };
    MockAjaxProvider.createCustomErrorXhrResponse = function (status, responseText) {
        return {
            response: responseText,
            responseText: responseText,
            responseType: "text",
            status: status,
            statusText: status + " Error"
        };
    };
    return MockAjaxProvider;
}());
var methodHandlers = {
    "GET": MockAjaxProvider.createErrorXhrResponse,
    "POST": MockAjaxProvider.createErrorXhrResponse,
    "PUT": MockAjaxProvider.createErrorXhrResponse,
    "PATCH": MockAjaxProvider.createErrorXhrResponse,
    "DELETE": MockAjaxProvider.createErrorXhrResponse
};
module.exports = MockAjaxProvider;
//# sourceMappingURL=MockAjaxProvider.js.map