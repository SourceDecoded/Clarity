import ErrorResponse = require("../data/responses/ErrorResponse");
import ValidationErrorResponse = require("../data/responses/ValidationErrorResponse");
import ConnectionErrorResponse = require("../data/responses/ConnectionErrorResponse");
import ForbiddenErrorResponse = require("../data/responses/ForbiddenErrorResponse");
import UnauthorizedErrorResponse = require("../data/responses/UnauthorizedErrorResponse");
import EntityNotFoundErrorResponse = require("../data/responses/EntityNotFoundErrorResponse");

export = function (error, entity) {
    var data;
    var err;
    data = error.xhr.responseText ? JSON.parse(error.xhr.responseText) : {};

    // I really hate this, but its comparing primitives and is only in one place.
    if (error.xhr.status === 401) {
        err = new UnauthorizedErrorResponse("Unauthorized");
    } else if (error.xhr.status === 403) {
        err = new ForbiddenErrorResponse(data.Message);
    } else if (error.xhr.status === 404) {
        err = new EntityNotFoundErrorResponse("File Not Found", entity);
    } else if (error.xhr.status === 0) {
        err = new ConnectionErrorResponse("Could not perform action due to a connection problem, please verify connectivity and try again");
    } else if (error.xhr.status === 400) {
        data = JSON.parse(error.xhr.response);
        err = new ValidationErrorResponse(data.Data.ValidationErrors, data.Data.ValidationErrors);
    } else {
        err = new ErrorResponse("Unknown Error");
    }

    return err;
};

