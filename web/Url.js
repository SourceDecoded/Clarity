"use strict";
const queryString = require("./queryString");
//Thanks Douglas Crockford. Found in the book: "Javascript the Good Parts".
var parse_url = /^(?:([A-Za-z]+):)?(\/{0,3})([0-9.\-A-Za-z]+)(?::(\d+))?(?:\/([^?#]*))?(?:\?([^#]*))?(?:#(.*))?$/;
var pageRegExp = /\.[^\.]*?$/i;
var parseQuery = queryString.parse;
var stringify = queryString.toString;
class Url {
    constructor(url) {
        this.getParsedQuery = function () {
            return this.queryStringValues;
        };
        this.getHash = function () {
            if (!this.hash) {
                return "";
            }
            return decodeURIComponent(this.hash);
        };
        this.url = url || "";
        this.result = parse_url.exec(url);
        if (this.result === null) {
            this.result = [];
        }
        this.scheme = this.result[1];
        this.slash = this.result[2];
        this.host = this.result[3];
        this.port = this.result[4];
        this.path = this.result[5];
        this.query = this.result[6];
        this.hash = this.result[7] || "";
        this.queryStringValues = parseQuery(this.result[6]);
        if (typeof this.port === "undefined") {
            this.port = (this.scheme === "https") ? 443 : 80;
        }
        else {
            this.port = parseInt(this.port, 10);
        }
    }
    getHref() {
        var schemeString = this.scheme || "http";
        var hostString = this.host || "";
        var slashString = this.slash || "";
        var portString = (this.port === 80 && schemeString === "http") || (this.port === 443 && schemeString === "https") || typeof this.port === "undefined" || isNaN(this.port) ? "" : ":" + this.port;
        var hashString = this.hash ? "#" + encodeURIComponent(this.hash) : "";
        var pathString = this.path ? "/" + encodeURI(this.path) : "";
        var queryString = this.query ? "?" + this.query : "";
        return schemeString + ":" + slashString + hostString + portString + pathString + queryString + hashString;
    }
    getScheme() {
        return this.scheme;
    }
    setScheme(value) {
        this.scheme = value;
    }
    getSlash() {
        return decodeURI(this.slash);
    }
    setSlash(value) {
        this.slash = value;
    }
    getHost() {
        return this.host;
    }
    setHost(value) {
        this.host = value;
    }
    getPort() {
        return this.port;
    }
    setPort(value) {
        this.port = value;
    }
    getPath() {
        return decodeURI(this.path);
    }
    setPath(value) {
        this.path = value;
    }
    getQuery() {
        if (!this.query) {
            return "";
        }
        return decodeURI(this.query);
    }
    setQuery(obj) {
        this.queryStringValues = obj;
        this.query = stringify(obj).substr(1);
    }
    setHash(value) {
        this.hash = value;
    }
    getPage() {
        var tmpArray;
        if (this.path) {
            tmpArray = this.path.split("/");
            return tmpArray[tmpArray.length - 1];
        }
        else {
            return "";
        }
    }
    getExtension() {
        var page = this.getPage();
        if (page) {
            var regExp = /\.[^\.]*?$/i;
            var value = page.match(regExp);
            return value ? value[0] : undefined;
        }
        else {
            return "";
        }
    }
    toString() {
        return this.getHref();
    }
}
module.exports = Url;
//# sourceMappingURL=Url.js.map