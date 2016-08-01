define(["require", "exports", "../async/Future"], function (require, exports, Future) {
    var RawAjaxDataConverter = (function () {
        function RawAjaxDataConverter() {
        }
        RawAjaxDataConverter.prototype.handleResponseAsync = function (xhr) {
            return Future.fromResult(xhr);
        };
        RawAjaxDataConverter.prototype.handleRequestAsync = function (options) {
            return Future.fromResult(options);
        };
        RawAjaxDataConverter.prototype.handleErrorResponseAsync = function (xhr) {
            var error = new Error("Response Error");
            error.xhr = xhr;
            return Future.fromError(error);
        };
        return RawAjaxDataConverter;
    })();
    return RawAjaxDataConverter;
});
