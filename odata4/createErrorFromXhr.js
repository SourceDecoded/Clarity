"use strict";
const ErrorResponse = require("../data/responses/ErrorResponse");
const ValidationErrorResponse = require("../data/responses/ValidationErrorResponse");
const ConnectionErrorResponse = require("../data/responses/ConnectionErrorResponse");
const ForbiddenErrorResponse = require("../data/responses/ForbiddenErrorResponse");
const UnauthorizedErrorResponse = require("../data/responses/UnauthorizedErrorResponse");
const EntityNotFoundErrorResponse = require("../data/responses/EntityNotFoundErrorResponse");
module.exports = function (error, entity) {
    var data;
    var err;
    data = error.xhr.responseText ? JSON.parse(error.xhr.responseText) : {};
    // I really hate this, but its comparing primitives and is only in one place.
    if (error.xhr.status === 401) {
        err = new UnauthorizedErrorResponse("Unauthorized");
    }
    else if (error.xhr.status === 403) {
        err = new ForbiddenErrorResponse(data.Message);
    }
    else if (error.xhr.status === 404) {
        err = new EntityNotFoundErrorResponse("File Not Found", entity);
    }
    else if (error.xhr.status === 0) {
        err = new ConnectionErrorResponse("Could not perform action due to a connection problem, please verify connectivity and try again");
    }
    else if (error.xhr.status === 400) {
        data = JSON.parse(error.xhr.response);
        err = new ValidationErrorResponse(data.Data.ValidationErrors, data.Data.ValidationErrors);
    }
    else {
        err = new ErrorResponse("Unknown Error");
    }
    return err;
};
//# sourceMappingURL=createErrorFromXhr.js.map