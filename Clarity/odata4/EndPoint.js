"use strict";
var Queryable = require("../query/Queryable");
var ODataProvider = require("./ODataProvider");
var ToServiceDto = require("./ToServiceDto");
var FromServiceDto = require("./FromServiceDto");
var convertToODataValue = require("./convertToODataValue");
var AddedResponse = require("../data/responses/AddedResponse");
var UpdatedResponse = require("../data/responses/UpdatedResponse");
var RemovedResponse = require("../data/responses/RemovedResponse");
var FunctionInvocation = require("./FunctionInvocation");
var getPrimaryKeys = function (model) {
    var primaryKey = Object.keys(model.properties).filter(function (key) {
        var property = model.properties[key];
        return property.primaryKey;
    })[0];
    if (typeof primaryKey === "undefined") {
        throw new Error("No primary key found for '" + model.collectionName + "'.");
    }
    return primaryKey;
};
var EndPoint = (function () {
    function EndPoint(config) {
        this.config = config || {};
        this.url = this.config.url;
        this.model = this.config.model;
        this.edm = this.config.edm;
        this.queryProvider = this.config.queryProvider;
        this.ajaxProvider = this.config.ajaxProvider;
        if (typeof this.url === "undefined" || this.url === null) {
            throw new Error("EndPoint: Null Argument Exception - url needs to be a string.");
        }
        if (typeof this.model === "undefined" || this.model === null) {
            throw new Error("EndPoint: Null Argument Exception - model needs to be supplied.");
        }
        if (typeof this.queryProvider === "undefined" || this.queryProvider === null) {
            throw new Error("EndPoint: Null Argument Exception - queryProvider cannot be undefined.");
        }
        if (typeof this.ajaxProvider === "undefined" || this.ajaxProvider === null) {
            throw new Error("EndPoint: Null Argument Exception - ajaxProvider cannot be undefined.");
        }
        if (typeof this.edm === "undefined" || this.edm === null) {
            throw new Error("EndPoint: Null Argument Exception - model needs to be supplied.");
        }
        if (this.url.lastIndexOf("/") === this.url.length - 1) {
            this.url = this.url.substr(0, this.url.length - 1);
        }
        this.toServiceDto = new ToServiceDto(this.edm);
        this.fromServiceDto = new FromServiceDto(this.edm);
        this.primaryKey = getPrimaryKeys(this.model);
        this.functionInvocation = new FunctionInvocation(this.ajaxProvider);
    }
    EndPoint.prototype.buildEntityUrl = function (entity) {
        var id = entity[this.primaryKey];
        if (typeof id === "undefined") {
            throw new Error("Entity doesn't have a primary key value.");
        }
        var entityUrl = this.url + "(" + id + ")";
        return entityUrl;
    };
    ;
    EndPoint.prototype.add = function (entity) {
        if (entity == null) {
            throw new Error("The parameter entity cannot be null or undefined.");
        }
        var dto = this.toServiceDto.resolve(entity);
        return this.ajaxProvider.request(this.url, {
            method: "POST",
            data: dto
        }).chain(function (dto) {
            dto = this.fromServiceDto.resolve(this.model, dto);
            return new AddedResponse("Successfully Added.", dto);
        });
    };
    EndPoint.prototype.update = function (entity, updates) {
        if (entity == null) {
            throw new Error("The parameter entity cannot be null or undefined.");
        }
        if (Object.keys(updates).length === 0) {
            throw new Error("Need to have at least one property to update.");
        }
        var dto = this.toServiceDto.resolveUpdate(entity, updates);
        return this.ajaxProvider.request(this.buildEntityUrl(entity), {
            method: "PATCH",
            data: dto
        }).chain(function () {
            return new UpdatedResponse("Successfully Updated.");
        });
    };
    ;
    EndPoint.prototype.remove = function (entity) {
        return this.ajaxProvider.request(this.buildEntityUrl(entity), {
            method: "DELETE"
        }).chain(function () {
            return new RemovedResponse("Successfully Removed.");
        });
    };
    ;
    EndPoint.prototype.getQueryProvider = function () {
        return this.queryProvider;
    };
    EndPoint.prototype.asQueryable = function () {
        var queryable = new Queryable();
        queryable.provider = this.getQueryProvider();
        return queryable;
    };
    EndPoint.prototype.invokeInstanceFunction = function (entity, methodName, parameters, ajaxOptions) {
        var keyName = this.edm.getPrimaryKeyProperties(this.model.type)[0];
        var fullUrl = this.url + "(" + convertToODataValue(entity[keyName]) + ")";
        return this.functionInvocation.invokeAsync(fullUrl, methodName, parameters, ajaxOptions);
    };
    ;
    EndPoint.prototype.invokeClassFunction = function (methodName, parameters, ajaxOptions) {
        return this.functionInvocation.invokeAsync(this.url, methodName, parameters, ajaxOptions);
    };
    ;
    EndPoint.prototype.invokeClassMethodWithQueryable = function (methodName, parameters, queryable) {
        var functionInvocationUrl = this.functionInvocation.buildUrl(this.url, methodName, parameters);
        var config = {
            url: functionInvocationUrl,
            model: this.model,
            edm: this.edm,
            ajaxProvider: this.ajaxProvider
        };
        var odataProvider = new ODataProvider(config);
        return odataProvider.execute(queryable);
    };
    EndPoint.prototype.getUrl = function () {
        return this.url;
    };
    EndPoint.prototype.getAjaxProvider = function () {
        return this.ajaxProvider;
    };
    ;
    return EndPoint;
}());
module.exports = EndPoint;
//# sourceMappingURL=EndPoint.js.map