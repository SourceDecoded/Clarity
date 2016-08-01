"use strict";
const Future = require("../../async/Future");
const PathResolver = require("../PathResolver");
const Url = require("../Url");
var futurize = function (promise) {
    return new Future(function (resolve, reject) {
        promise.then(resolve).catch(reject);
    });
};
class Components {
    constructor(moduleLoader, ajaxProvider, htmlParser, componentDocument) {
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
    stripExtensions(str) {
        return str.replace(/(.*?)(\..*?$)/, (match, part1, part2) => {
            return part1;
        });
    }
    replaceDashesWithSlashes(str) {
        return str.replace("\-", "/");
    }
    findUnknownElements(element, array) {
        return element.children.reduce((accumulated, childElement) => {
            if (childElement instanceof HTMLUnknownElement) {
                accumulated.push(childElement);
            }
            this.findUnknownElements(childElement, accumulated);
            return array;
        }, array);
    }
    loadComponentAsync(name) {
        var urlString = this.getUrlByName(name);
        var elementFuture = this.ajaxProvider.request(urlString + ".html").chain((html) => {
            var element = this.htmlParser.parse(html);
            var unknownElements = this.findUnknownElements(element, []);
            var dependenciesElementFutures = unknownElements.filter((element) => {
                if (element.tagName !== name) {
                    return true;
                }
                return false;
            }).map((element) => {
                return this.loadComponentAsync(element.tagName);
            });
            return Future.all(dependenciesElementFutures);
        });
        //Future.all([htmlFuture]).chain(() => {
        //});
    }
    getUrlByName(name) {
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
    }
    getPathByName(name) {
        var mapping = this._config.map[name];
        if (typeof mapping === "string") {
            return this.stripExtensions(mapping);
        }
        return this.replaceDashesWithSlashes(name);
    }
    get config() {
        return this._config;
    }
    set config(config) {
        this._config = config;
        this._config.map = this._config.map || {};
    }
}
module.exports = Components;
//# sourceMappingURL=Components.js.map