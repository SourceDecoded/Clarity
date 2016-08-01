import Queryable = require("../query/Queryable");
import PathResolver = require("../web/PathResolver");
import ODataProvider = require("./ODataProvider");
import ToServiceDto = require("./ToServiceDto");
import FromServiceDto = require("./FromServiceDto");
import convertToODataValue = require("./convertToODataValue");
import AddedResponse = require("../data/responses/AddedResponse");
import UpdatedResponse = require("../data/responses/UpdatedResponse");
import RemovedResponse = require("../data/responses/RemovedResponse");
import FunctionInvocation = require("./FunctionInvocation");

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

class EndPoint {
    private config;
    private url;
    private model;
    private edm;
    private queryProvider;
    private ajaxProvider;
    private toServiceDto;
    private fromServiceDto;
    private primaryKey;
    private functionInvocation;

    buildEntityUrl(entity) {
        var id = entity[this.primaryKey];
        if (typeof id === "undefined") {
            throw new Error("Entity doesn't have a primary key value.");
        }

        var entityUrl = this.url + "(" + id + ")";

        return entityUrl;
    };

    constructor(config) {
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

    add(entity) {
        if (entity == null) {
            throw new Error("The parameter entity cannot be null or undefined.");
        }

        var dto = this.toServiceDto.resolve(entity);

        return this.ajaxProvider.request(this.url, {
            method: "POST",
            data: dto
        }).chain((dto) => {
            dto = this.fromServiceDto.resolve(this.model, dto);
            return new AddedResponse("Successfully Added.", dto);
        });
    }

    update(entity, updates) {
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
        }).chain(() => {

            return new UpdatedResponse("Successfully Updated.");
        });
    };

    remove(entity) {
        return this.ajaxProvider.request(this.buildEntityUrl(entity), {
            method: "DELETE"
        }).chain(() => {
            return new RemovedResponse("Successfully Removed.");
        });
    };

    getQueryProvider() {
        return this.queryProvider;
    }

    asQueryable() {
        var queryable = new Queryable();
        queryable.provider = this.getQueryProvider();
        return queryable;
    }

    invokeInstanceFunction(entity, methodName, parameters?, ajaxOptions?) {
        var keyName = this.edm.getPrimaryKeyProperties(this.model.type)[0];
        var fullUrl = this.url + "(" + convertToODataValue(entity[keyName]) + ")";
        return this.functionInvocation.invokeAsync(fullUrl, methodName, parameters, ajaxOptions);
    };

    invokeClassFunction(methodName, parameters?, ajaxOptions?) {
        return this.functionInvocation.invokeAsync(this.url, methodName, parameters, ajaxOptions);
    };

    invokeClassMethodWithQueryable(methodName, parameters?, queryable?) {
        var functionInvocationUrl = this.functionInvocation.buildUrl(this.url, methodName, parameters);

        var config = {
            url: functionInvocationUrl,
            model: this.model,
            edm: this.edm,
            ajaxProvider: this.ajaxProvider
        };

        var odataProvider = new ODataProvider(config);
        return odataProvider.execute(queryable);
    }

    getUrl() {
        return this.url;
    }

    getAjaxProvider() {
        return this.ajaxProvider;
    };
}

export = EndPoint;