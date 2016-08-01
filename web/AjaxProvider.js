define(["require", "exports", "./HttpRequest", "./RawAjaxDataConverter"], function (require, exports, HttpRequest, RawAjaxDataConverter) {
    var rawDataConverter = new RawAjaxDataConverter();
    var AjaxProvider = (function () {
        function AjaxProvider(defaultOptions) {
            this.defaultOptions = defaultOptions || {};
            this.dataConverter = defaultOptions.dataConverter || rawDataConverter;
        }
        AjaxProvider.prototype.request = function (url, options) {
            var _this = this;
            options = options || {};
            Object.keys(this.defaultOptions).forEach(function (key) {
                if (typeof options[key] === "undefined") {
                    options[key] = _this.defaultOptions[key];
                }
            });
            options.url = url;
            return this.dataConverter.handleRequestAsync(options).chain(function () {
                var request = new HttpRequest(url, options);
                return request.sendAsync();
            }).chain(function (xhr) {
                return _this.dataConverter.handleResponseAsync(xhr);
            })["catch"](function (error) {
                return _this.dataConverter.handleErrorResponseAsync(error);
            });
        };
        return AjaxProvider;
    })();
    return AjaxProvider;
});
