"use strict";
var Future = require("../../async/Future");
var PathResolver = require("../PathResolver");
var Url = require("../Url");
var futurize = function (promise) {
    return new Future(function (resolve, reject) {
        promise.then(resolve).catch(reject);
    });
};
var Components = (function () {
    function Components(moduleLoader, ajaxProvider, htmlParser, componentDocument) {
        if (moduleLoader == null) {
            throw new Error("Null Argument Exception: SystemJs needs to defined.");
        }
        if (ajaxProvider == null) {
            throw new Error("Null Argument Exception: ajaxProvider needs to defined.");
        }
        if (htmlParser == null) {
            throw new Error("Null Argument Exception: htmlParser needs to defined.");
        }
        if (componentDocument == null) {
            throw new Error("Null Argument Exception: componentDocument needs to defined.");
        }
        this.config = {};
        this.ajaxProvider = ajaxProvider;
        this.moduleLoader = moduleLoader;
        this.htmlParser = htmlParser;
        this.componentDocument = componentDocument;
    }
    Components.prototype.stripExtensions = function (str) {
        return str.replace(/(.*?)(\..*?$)/, function (match, part1, part2) {
            return part1;
        });
    };
    Components.prototype.replaceDashesWithSlashes = function (str) {
        return str.replace("\-", "/");
    };
    Components.prototype.findUnknownElements = function (element, array) {
        var _this = this;
        return element.children.reduce(function (accumulated, childElement) {
            if (childElement instanceof HTMLUnknownElement) {
                accumulated.push(childElement);
            }
            _this.findUnknownElements(childElement, accumulated);
            return array;
        }, array);
    };
    Components.prototype.loadComponentAsync = function (name) {
        var _this = this;
        var urlString = this.getUrlByName(name);
        var elementFuture = this.ajaxProvider.request(urlString + ".html").chain(function (html) {
            var element = _this.htmlParser.parse(html);
            var unknownElements = _this.findUnknownElements(element, []);
            var dependenciesElementFutures = unknownElements.filter(function (element) {
                if (element.tagName !== name) {
                    return true;
                }
                return false;
            }).map(function (element) {
                return _this.loadComponentAsync(element.tagName);
            });
            return Future.all(dependenciesElementFutures);
        });
        //Future.all([htmlFuture]).chain(() => {
        //});
    };
    Components.prototype.getUrlByName = function (name) {
        // Handle relative and absolute paths without a baseUrl
        if (this._config.baseUrl == null) {
            return this.getPathByName(name);
        }
        // Handle baseUrl with an absolute paths or relative paths
        if (this._config.baseUrl.indexOf("http") !== 0) {
            var pathResolver = new PathResolver(this._config.baseUrl);
            return pathResolver.resolve(this.getPathByName(name));
        }
        // Handle full Urls
        var url = new Url(this._config.baseUrl);
        var pathResolver = new PathResolver(url.getPath());
        url.setPath(pathResolver.resolve(this.getPathByName(name)));
        return url.toString();
    };
    Components.prototype.getPathByName = function (name) {
        var mapping = this._config.map[name];
        if (typeof mapping === "string") {
            return this.stripExtensions(mapping);
        }
        return this.replaceDashesWithSlashes(name);
    };
    Object.defineProperty(Components.prototype, "config", {
        get: function () {
            return this._config;
        },
        set: function (config) {
            this._config = config;
            this._config.map = this._config.map || {};
        },
        enumerable: true,
        configurable: true
    });
    return Components;
}());
module.exports = Components;
//# sourceMappingURL=Components.js.map