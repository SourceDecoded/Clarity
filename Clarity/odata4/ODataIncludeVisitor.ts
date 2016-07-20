import ExpressionVisitor = require("../query/ExpressionVisitor");
import indexOfByFunction = require("../array/indexOfByFunction");
import ODataVisitor = require("./ODataVisitor");
import toPascalCase = require("../string/toPascalCase");
import getObject = require("../util/getObject");
import createNamespace = require("../util/createNamespace");

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

class ODataIncludeVisitor extends ExpressionVisitor {
    private _config;
    private _model;
    private _edm;
    private _propertyAccessors;
    private _currentNamespace;
    private _currentModel;
    private _propertyModels;
    private _currentPropertyModel;
    private convertPropertiesToPascalCase;

    constructor(config) {
        super();
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

    private _innerWriteIncude(property, propertyAccessor) {
        var self = this;
        return "$expand=" + self._writeInclude(property, propertyAccessor);
    }

    private _writeInclude(property, propertyAccessor) {
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
    }

    include() {
        var self = this;

        if (Object.keys(self._propertyAccessors).length === 0) {
            return "";
        }

        return "$expand=" + Object.keys(self._propertyAccessors).map(function (key) {
            return self._writeInclude(key, self._propertyAccessors[key]);
        }).join(",");
    }

    expression(whereExpression) {
        var self = this;
        var config = {
            edm: self._edm,
            model: self._currentModel
        };
        var odataVisitor = new ODataVisitor(config);
        return odataVisitor.parse(whereExpression.value);
    }

    queryable(modelMetaData, odataWhereString) {
        getObject(modelMetaData.namespace, this._propertyAccessors).filter = odataWhereString;
    }

    propertyAccess(modelMetaData, property) {
        var propertyName = (this.convertPropertiesToPascalCase ? property.toPascalCase() : property)

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
    }

    property(expression) {
        return expression.value;
    }

    type() {
        this._currentNamespace = "";
        this._currentModel = this._model;
        var navigationProperties = getNavigationProperties(this._edm, this._model);

        return {
            namespace: this._currentNamespace,
            navigationProperties: navigationProperties
        };
    }


}

export = ODataIncludeVisitor;