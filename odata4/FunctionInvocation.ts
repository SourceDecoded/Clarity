import convertToOdataValue = require("./convertToOdataValue");

class FunctionInvocation {
    private ajaxProvider;
    constructor(ajaxProvider) {
        if (ajaxProvider == null) {
            throw new Error("Null Argument Exception: ajax needs to be defined.");
        }
        this.ajaxProvider = ajaxProvider;
    }

    invokeAsync(url, methodName, parameters?, options?) {

        var fullUrl = this.buildUrl(url, methodName, parameters, options);
        return this.ajaxProvider.request(fullUrl, options);
    };

    buildUrl(url, methodName, parameters?, options?) {

        url = url.lastIndexOf("/") === url.length - 1 ? url.substr(0, url.length - 1) : url;
        parameters = parameters || {};
        options = options || {};
        options.data = parameters;
        var parameterString = Object.keys(parameters).map((key) => {
            return key + "=" + convertToOdataValue(parameters[key]);
        }).join(", ");

        var methodSignature = parameterString.length > 0 ? methodName + "(" + parameterString + ")" : methodName;

        return url + "/" + methodSignature;
    };
}

export = FunctionInvocation;