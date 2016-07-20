"use strict";
var Future = require("../async/Future");
var toCamelCasedProperties = require("./toCamelCasedProperties");
var toPascalCasedProperties = require("./toPascalCasedProperties");
var ValidationErrorResponse = require("../data/responses/ValidationErrorResponse");
var ConnectionErrorResponse = require("../data/responses/ConnectionErrorResponse");
var ForbiddenErrorResponse = require("../data/responses/ForbiddenErrorResponse");
var UnauthorizedErrorResponse = require("../data/responses/UnauthorizedErrorResponse");
var EntityNotFoundErrorResponse = require("../data/responses/EntityNotFoundErrorResponse");
var ErrorResponse = require("../data/responses/ErrorResponse");
var parseError = function (xhr) {
    var text = xhr.responseText;
    if (text && typeof text === "string") {
        try {
            var response = JSON.parse(text);
            return response.error.message || "";
        }
        catch (error) {
            return error.message;
        }
    }
    return "";
};
var OData4DataConverter = (function () {
    function OData4DataConverter() {
    }
    OData4DataConverter.prototype.handleResponseAsync = function (xhr) {
        var json;
        if (typeof xhr === "undefined" || xhr === null) {
            throw new Error("Null Argument Exception: xhr is undefined or null");
        }
        if (xhr.responseText === "") {
            return Future.fromResult(undefined);
        }
        try {
            json = JSON.parse(xhr.responseText);
            return Future.fromResult(toCamelCasedProperties(json));
        }
        catch (e) {
            return Future.fromError(new Error("XHR response contains invalid json."));
        }
    };
    OData4DataConverter.prototype.handleRequestAsync = function (options) {
        var data = options.data;
        try {
            if (typeof data === "object" && data !== null) {
                options.data = JSON.stringify(toPascalCasedProperties(data));
                return Future.fromResult(undefined);
            }
            return Future.fromResult(options);
        }
        catch (e) {
            return Future.fromError(new Error("The data property needs to be an object."));
        }
    };
    OData4DataConverter.prototype.handleErrorResponseAsync = function (xhr) {
        var error;
        var message = parseError(xhr);
        if (xhr.status === 0) {
            message = message || "Could not perform action due to a connection problem, please verify connectivity";
            error = new ConnectionErrorResponse(message);
        }
        else if (xhr.status === 400) {
            error = new ValidationErrorResponse(message, []);
        }
        else if (xhr.status === 401) {
            message = message || "Unauthorized";
            error = new UnauthorizedErrorResponse(message);
        }
        else if (xhr.status === 403) {
            message = message || "Forbidden";
            error = new ForbiddenErrorResponse(message);
        }
        else if (xhr.status === 404) {
            message = message || "File Not Found";
            error = new EntityNotFoundErrorResponse(message);
        }
        else {
            message = message || "Unknown Error";
            error = new ErrorResponse(message);
        }
        error.xhr = xhr;
        return Future.fromError(error);
    };
    ;
    return OData4DataConverter;
}());
module.exports = OData4DataConverter;
//# sourceMappingURL=OData4DataConverter.js.map