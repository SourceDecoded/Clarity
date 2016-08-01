"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var ExpressionVisitor = require("../query/ExpressionVisitor");
var ODataVisitor = require("./ODataVisitor");
var getObject = require("../util/getObject");
var createNamespace = require("../util/createNamespace");
var getNavigationProperties = function (edm, model) {
    var propertyModels = {};
    var tempEntity = new model.type();
    var oneToOneRelationships = edm.getOneToOneRelationships(tempEntity);
    var oneToOneAsTargetRelationships = edm.getOneToOneAsTargetRelationships(tempEntity);
    var oneToManyRelationships = edm.getOneToManyRelationships(tempEntity);
    var oneToManyAsTargetRelationships = edm.getOneToManyAsTargetRelationships(tempEntity);
    oneToOneRelationships.reduce(function (propertyModels, relationship) {
        propertyModels[relationship.hasOne] = edm.getModelByType(relationship.ofType);
        return propertyModels;
    }, propertyModels);
    oneToOneAsTargetRelationships.reduce(function (propertyModels, relationship) {
        propertyModels[relationship.withOne] = edm.getModelByType(relationship.type);
        return propertyModels;
    }, propertyModels);
    oneToManyRelationships.reduce(function (propertyModels, relationship) {
        propertyModels[relationship.hasMany] = edm.getModelByType(relationship.ofType);
        return propertyModels;
    }, propertyModels);
    oneToManyAsTargetRelationships.reduce(function (propertyModels, relationship) {
        propertyModels[relationship.withOne] = edm.getModelByType(relationship.type);
        return propertyModels;
    }, propertyModels);
    return propertyModels;
};
var ODataIncludeVisitor = (function (_super) {
    __extends(ODataIncludeVisitor, _super);
    function ODataIncludeVisitor(config) {
        _super.call(this);
        config = config || { type: Object, model: { properties: {} } };
        ExpressionVisitor.call(this);
        this._config = config;
        this._model = config.model;
        this._edm = config.edm;
        this._propertyAccessors = {};
        this._currentNamespace = "";
        this._currentModel = config.model;
        this._propertyModels = {};
        this._currentPropertyModel = config.model;
        this.convertPropertiesToPascalCase = typeof config.convertPropertiesToPascalCase === "boolean" ? config.convertPropertiesToPascalCase : true;
        if (typeof config.model === "undefined") {
            throw new Error("Null Argument Exception: model cannot be undefined in configurations.");
        }
        if (typeof config.edm === "undefined") {
            throw new Error("Null Argument Exception: edm cannot be undefined in configurations.");
        }
    }
    ODataIncludeVisitor.prototype._innerWriteIncude = function (property, propertyAccessor) {
        var self = this;
        return "$expand=" + self._writeInclude(property, propertyAccessor);
    };
    ODataIncludeVisitor.prototype._writeInclude = function (property, propertyAccessor) {
        var self = this;
        var commands = [];
        if (typeof propertyAccessor.filter === "string" && propertyAccessor.filter !== "") {
            commands.push(propertyAccessor.filter);
        }
        var expands = Object.keys(propertyAccessor).filter(function (key) {
            return key === "filter" ? false : true;
        });
        if (expands.length > 0) {
            commands.push("$expand=" + expands.map(function (key) {
                return self._writeInclude(key, propertyAccessor[key]);
            }).join(","));
        }
        var commandString = commands.join(";");
        if (commandString) {
            return property + "(" + commandString + ")";
        }
        return property;
    };
    ODataIncludeVisitor.prototype.include = function () {
        var self = this;
        if (Object.keys(self._propertyAccessors).length === 0) {
            return "";
        }
        return "$expand=" + Object.keys(self._propertyAccessors).map(function (key) {
            return self._writeInclude(key, self._propertyAccessors[key]);
        }).join(",");
    };
    ODataIncludeVisitor.prototype.expression = function (whereExpression) {
        var self = this;
        var config = {
            edm: self._edm,
            model: self._currentModel
        };
        var odataVisitor = new ODataVisitor(config);
        return odataVisitor.parse(whereExpression.value);
    };
    ODataIncludeVisitor.prototype.queryable = function (modelMetaData, odataWhereString) {
        getObject(modelMetaData.namespace, this._propertyAccessors).filter = odataWhereString;
    };
    ODataIncludeVisitor.prototype.propertyAccess = function (modelMetaData, property) {
        var propertyName = (this.convertPropertiesToPascalCase ? property.toPascalCase() : property);
        this._currentNamespace = this._currentNamespace ? this._currentNamespace += "." + propertyName : propertyName;
        createNamespace(this._currentNamespace, this._propertyAccessors);
        var propertyModel = modelMetaData.navigationProperties[property];
        this._currentModel = propertyModel;
        if (typeof propertyModel === "undefined") {
            throw new Error("Cannot find navigation property with name: " + property);
        }
        var navigationProperties = getNavigationProperties(this._edm, propertyModel);
        return {
            namespace: this._currentNamespace,
            navigationProperties: navigationProperties
        };
    };
    ODataIncludeVisitor.prototype.property = function (expression) {
        return expression.value;
    };
    ODataIncludeVisitor.prototype.type = function () {
        this._currentNamespace = "";
        this._currentModel = this._model;
        var navigationProperties = getNavigationProperties(this._edm, this._model);
        return {
            namespace: this._currentNamespace,
            navigationProperties: navigationProperties
        };
    };
    return ODataIncludeVisitor;
}(ExpressionVisitor));
module.exports = ODataIncludeVisitor;
//# sourceMappingURL=ODataIncludeVisitor.js.map