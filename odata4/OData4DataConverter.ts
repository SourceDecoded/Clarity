import Future = require("../async/Future");
import toCamelCasedProperties = require("./toCamelCasedProperties");
import toPascalCasedProperties = require("./toPascalCasedProperties");
import ValidationErrorResponse = require("../data/responses/ValidationErrorResponse");
import ConnectionErrorResponse = require("../data/responses/ConnectionErrorResponse");
import ForbiddenErrorResponse = require("../data/responses/ForbiddenErrorResponse");
import UnauthorizedErrorResponse = require("../data/responses/UnauthorizedErrorResponse");
import EntityNotFoundErrorResponse = require("../data/responses/EntityNotFoundErrorResponse");
import ErrorResponse = require("../data/responses/ErrorResponse");

var parseError = function (xhr) {
    var text = xhr.responseText;

    if (text && typeof text === "string") {
        try {
            var response = JSON.parse(text);
            return response.error.message || "";
        } catch (error) {
            return error.message;
        }
    }

    return "";
};

class OData4DataConverter {
    handleResponseAsync(xhr) {
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
        } catch (e) {
            return Future.fromError(new Error("XHR response contains invalid json."));
        }
    }


    handleRequestAsync(options) {
        var data = options.data;

        try {

            if (typeof data === "object" && data !== null) {
                options.data = JSON.stringify(toPascalCasedProperties(data));
                return Future.fromResult(undefined);
            }

            return Future.fromResult(options);

        } catch (e) {

            return Future.fromError(new Error("The data property needs to be an object."));

        }
    }

    handleErrorResponseAsync(xhr) {
        var error;

        var message = parseError(xhr);

        if (xhr.status === 0) {
            message = message || "Could not perform action due to a connection problem, please verify connectivity";
            error = new ConnectionErrorResponse(message);
        } else if (xhr.status === 400) {
            error = new ValidationErrorResponse(message, []);
        } else if (xhr.status === 401) {
            message = message || "Unauthorized";
            error = new UnauthorizedErrorResponse(message);
        } else if (xhr.status === 403) {
            message = message || "Forbidden";
            error = new ForbiddenErrorResponse(message);
        } else if (xhr.status === 404) {
            message = message || "File Not Found";
            error = new EntityNotFoundErrorResponse(message);
        } else {
            message = message || "Unknown Error";
            error = new ErrorResponse(message);
        }
        error.xhr = xhr;

        return Future.fromError(error);
    };
}

export = OData4DataConverter;