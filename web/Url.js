"use strict";
var queryString = require("./queryString");
//Thanks Douglas Crockford. Found in the book: "Javascript the Good Parts".
var parse_url = /^(?:([A-Za-z]+):)?(\/{0,3})([0-9.\-A-Za-z]+)(?::(\d+))?(?:\/([^?#]*))?(?:\?([^#]*))?(?:#(.*))?$/;
var pageRegExp = /\.[^\.]*?$/i;
var parseQuery = queryString.parse;
var stringify = queryString.toString;
var Url = (function () {
    function Url(url) {
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
    Url.prototype.getHref = function () {
        var schemeString = this.scheme || "http";
        var hostString = this.host || "";
        var slashString = this.slash || "";
        var portString = (this.port === 80 && schemeString === "http") || (this.port === 443 && schemeString === "https") || typeof this.port === "undefined" || isNaN(this.port) ? "" : ":" + this.port;
        var hashString = this.hash ? "#" + encodeURIComponent(this.hash) : "";
        var pathString = this.path ? "/" + encodeURI(this.path) : "";
        var queryString = this.query ? "?" + this.query : "";
        return schemeString + ":" + slashString + hostString + portString + pathString + queryString + hashString;
    };
    Url.prototype.getScheme = function () {
        return this.scheme;
    };
    Url.prototype.setScheme = function (value) {
        this.scheme = value;
    };
    Url.prototype.getSlash = function () {
        return decodeURI(this.slash);
    };
    Url.prototype.setSlash = function (value) {
        this.slash = value;
    };
    Url.prototype.getHost = function () {
        return this.host;
    };
    Url.prototype.setHost = function (value) {
        this.host = value;
    };
    Url.prototype.getPort = function () {
        return this.port;
    };
    Url.prototype.setPort = function (value) {
        this.port = value;
    };
    Url.prototype.getPath = function () {
        return decodeURI(this.path);
    };
    Url.prototype.setPath = function (value) {
        this.path = value;
    };
    Url.prototype.getQuery = function () {
        if (!this.query) {
            return "";
        }
        return decodeURI(this.query);
    };
    Url.prototype.setQuery = function (obj) {
        this.queryStringValues = obj;
        this.query = stringify(obj).substr(1);
    };
    Url.prototype.setHash = function (value) {
        this.hash = value;
    };
    Url.prototype.getPage = function () {
        var tmpArray;
        if (this.path) {
            tmpArray = this.path.split("/");
            return tmpArray[tmpArray.length - 1];
        }
        else {
            return "";
        }
    };
    Url.prototype.getExtension = function () {
        var page = this.getPage();
        if (page) {
            var regExp = /\.[^\.]*?$/i;
            var value = page.match(regExp);
            return value ? value[0] : undefined;
        }
        else {
            return "";
        }
    };
    Url.prototype.toString = function () {
        return this.getHref();
    };
    return Url;
}());
module.exports = Url;
//# sourceMappingURL=Url.js.map