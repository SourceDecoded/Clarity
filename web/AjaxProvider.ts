import HttpRequest = require("./HttpRequest");
import RawAjaxDataConverter = require("./RawAjaxDataConverter");

var rawDataConverter = new RawAjaxDataConverter();

class AjaxProvider {
    private defaultOptions;
    private dataConverter;
    constructor(defaultOptions) {
        this.defaultOptions = defaultOptions || {};
        this.dataConverter = defaultOptions.dataConverter || rawDataConverter;
    }

    request(url, options) {
        options = options || {};

        Object.keys(this.defaultOptions).forEach((key) => {
            if (typeof options[key] === "undefined") {
                options[key] = this.defaultOptions[key];
            }
        });

        options.url = url;

        return this.dataConverter.handleRequestAsync(options).chain(() => {
            var request = new HttpRequest(url, options);
            return request.sendAsync();
        }).chain((xhr) => {
            return this.dataConverter.handleResponseAsync(xhr);
        })["catch"]((error) => {
            return this.dataConverter.handleErrorResponseAsync(error);
        });

    }

}
export = AjaxProvider;