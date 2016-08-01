"use strict";
var convertToOdataValue = require("./convertToOdataValue");
var FunctionInvocation = (function () {
    function FunctionInvocation(ajaxProvider) {
        if (ajaxProvider == null) {
            throw new Error("Null Argument Exception: ajax needs to be defined.");
        }
        this.ajaxProvider = ajaxProvider;
    }
    FunctionInvocation.prototype.invokeAsync = function (url, methodName, parameters, options) {
        var fullUrl = this.buildUrl(url, methodName, parameters, options);
        return this.ajaxProvider.request(fullUrl, options);
    };
    ;
    FunctionInvocation.prototype.buildUrl = function (url, methodName, parameters, options) {
        url = url.lastIndexOf("/") === url.length - 1 ? url.substr(0, url.length - 1) : url;
        parameters = parameters || {};
        options = options || {};
        options.data = parameters;
        var parameterString = Object.keys(parameters).map(function (key) {
            return key + "=" + convertToOdataValue(parameters[key]);
        }).join(", ");
        var methodSignature = parameterString.length > 0 ? methodName + "(" + parameterString + ")" : methodName;
        return url + "/" + methodSignature;
    };
    ;
    return FunctionInvocation;
}());
module.exports = FunctionInvocation;
//# sourceMappingURL=FunctionInvocation.js.map