import Future = require("../async/Future");

class RawAjaxDataConverter {
    handleResponseAsync(xhr) {
        return Future.fromResult(xhr);
    }

    handleRequestAsync(options) {
        return Future.fromResult(options);
    }

    handleErrorResponseAsync(xhr) {
        var error = <any>new Error("Response Error");
        error.xhr = xhr;

        return Future.fromError(error);
    }
}

export = RawAjaxDataConverter

