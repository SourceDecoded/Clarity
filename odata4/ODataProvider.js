"use strict";
var Future = require("../async/Future");
var ODataVisitor = require("./ODataVisitor");
var ODataIncludeVisitor = require("./ODataIncludeVisitor");
var queryString = require("../web/queryString");
var ExpressionPackage = require("../query/Expression");
var FromServiceDto = require("./FromServiceDto");
var OperationExpression = ExpressionPackage.OperationExpression;
var ODataProvider = (function () {
    function ODataProvider(config) {
        this.config = config || {};
        this.url = config.url;
        this.edm = config.edm;
        this.model = config.model;
        this.ajaxProvider = config.ajaxProvider;
        if (typeof this.url === "undefined" || this.url === null) {
            throw new Error("ODataProvider: Null argumentexception - url");
        }
        if (typeof this.ajaxProvider === "undefined" || this.ajaxProvider === null) {
            throw new Error("ODataProvider: Null argument exception - ajaxProvider");
        }
        if (typeof this.model === "undefined" || this.model === null) {
            throw new Error("ODataProvider: Null argument exception - model");
        }
        if (typeof this.edm === "undefined" || this.edm === null) {
            throw new Error("ODataProvider: Null argument exception - edm");
        }
        if (this.url.lastIndexOf("/") === this.url.length - 1) {
            this.url = this.url.substr(0, this.url.length - 1);
        }
        this.fromServiceDto = new FromServiceDto(this.edm);
    }
    ODataProvider.prototype.buildUrl = function (expression, additionalString) {
        var odataVisitor = new ODataVisitor(this.config);
        var includeVisitor = new ODataIncludeVisitor(this.config);
        var where = odataVisitor.parse(expression.where);
        var take = odataVisitor.parse(expression.take);
        var skip = odataVisitor.parse(expression.skip);
        var orderBy = odataVisitor.parse(expression.orderBy);
        var include = includeVisitor.parse(expression.include);
        var parameterQueryString = queryString.toString(expression.parameters, false);
        var parts = Array.prototype.slice.call(arguments, 1);
        parts.unshift(where, skip, take, orderBy, include, parameterQueryString);
        var odataString = parts.filter(function (part) {
            return part !== "";
        }).join("&");
        return this.url + (odataString ? "?" + odataString : "");
    };
    ODataProvider.prototype.requestHandler = function (url) {
        return this.ajaxProvider.request(url, {
            method: "GET"
        });
    };
    ODataProvider.prototype.convertDtos = function (dtos) {
        var _this = this;
        return dtos.map(function (dto) {
            return _this.fromServiceDto.resolve(_this.model, dto);
        });
    };
    ODataProvider.prototype.count = function (queryable) {
        var expression = queryable.getExpression();
        // Overriding take so no results are return, because we only want a count.
        expression.take = OperationExpression.take(0);
        var url = this.buildUrl(expression, "$count=true");
        return this.requestHandler(url).chain(function (response) {
            return response["@odata.count"];
        })["catch"](function (e) {
            return Future.fromError(e);
        });
    };
    ODataProvider.prototype.toArrayWithCount = function (queryable) {
        var _this = this;
        var expression = queryable.getExpression();
        var url = this.buildUrl(expression, "$count=true");
        return this.requestHandler(url).chain(function (response) {
            if (!Array.isArray(response.value)) {
                return Future.fromError(new Error("XHR response does not contain expected value node."));
            }
            return {
                count: response["@odata.count"],
                array: _this.convertDtos(response.value)
            };
        });
    };
    ;
    //This should always return a Future of an array of objects.
    ODataProvider.prototype.execute = function (queryable) {
        var _this = this;
        var expression = queryable.getExpression();
        var url = this.buildUrl(expression);
        return this.requestHandler(url).chain(function (response) {
            if (!Array.isArray(response.value)) {
                return Future.fromError(new Error("XHR response does not contain expected value node."));
            }
            return _this.convertDtos(response.value);
        });
    };
    ODataProvider.prototype.toArray = function (queryable) {
        return this.execute(queryable);
    };
    return ODataProvider;
}());
module.exports = ODataProvider;
//# sourceMappingURL=ODataProvider.js.map