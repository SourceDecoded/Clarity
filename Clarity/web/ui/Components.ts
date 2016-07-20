import Future = require("../../async/Future");
import PathResolver = require("../PathResolver");
import ComponentDocument = require("./ComponentDocument");
import Url = require("../Url");

var futurize = function (promise) {
    return new Future(function (resolve, reject) {
        promise.then(resolve).catch(reject);
    });
};

interface IModuleLoader {
    import(path: string);
}

interface IAjaxProvider {
    request(url: string, options?): Future<string>
}

interface IHtmlParser {
    parse(html: string);
}

class Components {
    moduleLoader: IModuleLoader;
    _config;
    ajaxProvider: IAjaxProvider;
    htmlParser: IHtmlParser;
    componentDocument: ComponentDocument;

    constructor(
        moduleLoader: IModuleLoader,
        ajaxProvider: IAjaxProvider,
        htmlParser: IHtmlParser,
        componentDocument: ComponentDocument
        ) {

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

    private stripExtensions(str: string) {
        return str.replace(/(.*?)(\..*?$)/, (match, part1, part2) => {
            return part1;
        });
    }

    private replaceDashesWithSlashes(str: string) {
        return str.replace("\-", "/");
    }

    private findUnknownElements(element, array) {
        return element.children.reduce((accumulated, childElement) => {
            if (childElement instanceof HTMLUnknownElement) {
                accumulated.push(childElement);
            }

            this.findUnknownElements(childElement, accumulated);
            return array;
        }, array);
    }

    loadComponentAsync(name: string) {
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

    getUrlByName(name: string) {
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

    getPathByName(name: string) {
        var mapping = this._config.map[name];

        if (typeof mapping === "string") {
            return this.stripExtensions(mapping);
        }

        return this.replaceDashesWithSlashes(name);
    }

    get config() {
        return this._config;
    }

    set config(config: { map?: any; baseUrl?: string; }) {
        this._config = config;
        this._config.map = this._config.map || {};
    }

}

export = Components;