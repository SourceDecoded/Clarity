"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var ExpressionVisitor = require("../query/ExpressionVisitor");
var ODataAnnotation = require("./ODataAnnotation");
var EdmPackage = require("../data/Edm");
require("../number/toEnumString");
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
var toServiceNamespace = function (value) {
    var array = value.split(".");
    var newArray = [];
    var scope = this.scope ? this.scope + "/" : "";
    array.forEach(function (name) {
        newArray.push(scope + name.substr(0, 1).toUpperCase() + name.substring(1));
    });
    return newArray.join(".");
};
var getOneToManyType = function (edm, Type, property) {
    var ChildType = edm.getOneToManyRelationships(new Type()).filter(function (relationship) {
        return relationship.hasMany === property;
    }).map(function (relationship) {
        return relationship.ofType;
    })[0];
    if (ChildType == null) {
        throw new Error("Couldn't find one to many relationship with property name: " + property);
    }
    return ChildType;
};
var buildConfigForOneToManyTraversing = function (parentConfig, property) {
    var edm = parentConfig.edm;
    var model = parentConfig.model;
    var config = {};
    if (edm != null && model != null) {
        var Type = model.type;
        var ChildType = getOneToManyType(edm, Type, property);
        config.scope = "entity";
        config.edm = edm;
        config.model = edm.getModelByType(ChildType);
    }
    return config;
};
var hasOdataAnnotation = function (annotation) {
    return annotation.constructor === ODataAnnotation;
};
var getOdataNamespace = function (Type) {
    if (!Array.isArray(Type.annotations)) {
        throw new Error("No ODataAnnotation found; Type.annotations is not an array.");
    }
    var index = Type.annotations.indexOfByFunction(hasOdataAnnotation);
    if (index === -1) {
        throw new Error("No ODataAnnotation found.");
    }
    return Type.annotations[index].namespace;
};
var ODataVisitor = (function (_super) {
    __extends(ODataVisitor, _super);
    function ODataVisitor(config) {
        _super.call(this);
        config = this.config = (config || {});
        this.scope = config.scope || "";
        if (typeof config.model === "undefined") {
            throw new Error("Null Argument Exception: model cannot be undefined in configurations.");
        }
        if (typeof config.edm === "undefined") {
            throw new Error("Null Argument Exception: edm cannot be undefined in configurations.");
        }
        var model = this.model = config.model || { properties: {} };
        this.currentModel = this.model;
        this.edm = config.edm;
        this.toServiceNamespace = toServiceNamespace;
        this.convertPropertiesToPascalCase = typeof config.convertPropertiesToPascalCase === "boolean" ? config.convertPropertiesToPascalCase : true;
    }
    ODataVisitor.prototype.getValue = function (key, value) {
        var property = this.currentModel.properties[key];
        var dateString;
        if (property) {
            if (value === null) {
                return "null";
            }
            if (property.type === Date || property.type === EdmPackage.DateTimeOffset) {
                dateString = value.toISOString();
                dateString = dateString.substr(0, dateString.length - 1);
                dateString += "-00:00";
                return dateString;
            }
            else if (property.type === EdmPackage.Enum) {
                if (typeof value !== "number" && !(value instanceof Number)) {
                    throw new Error("The value for an enum needs to be a number. The property is '" + key + "'.");
                }
                return getOdataNamespace(property.genericTypeParameters[0]) + "'" + value.toEnumString(property.genericTypeParameters[0]) + "'";
            }
            else if (property.type === EdmPackage.EnumFlag) {
                if (typeof value !== "number" && !(value instanceof Number)) {
                    throw new Error("The value for an enum flag needs to be a number. The property is '" + key + "'.");
                }
                return getOdataNamespace(property.genericTypeParameters[0]) + "'" + value.toEnumFlagString(property.genericTypeParameters[0]) + "'";
            }
            else if (property.type === Number) {
                return value.toString();
            }
            else if (property.type === String) {
                var escapedString = value.replace(/'/g, "''").replace(/\&/g, "%26").replace(/\#/g, "%23");
                return "'" + escapedString + "'";
            }
            else if (property.type === Boolean) {
                return value.toString();
            }
            else {
                return value;
            }
        }
        else {
            throw new Error("Couldn't find a '" + key + "' property definitions on '" + this.model.collectionName + "'.");
        }
    };
    ODataVisitor.prototype.isIn = function (propertyObject, array) {
        var self = this;
        if (array.length > 0) {
            return "(" + array.map(function (value) {
                return propertyObject.namespace + " eq " + self.getValue(propertyObject.property, value);
            }).join(" or ") + ")";
        }
        else {
            return "";
        }
    };
    ODataVisitor.prototype.isNotIn = function (propertyObject, array) {
        var self = this;
        if (array.length > 0) {
            return "(" + array.map(function (value) {
                return propertyObject.namespace + " ne " + self.getValue(propertyObject.property, value);
            }).join(" and ") + ")";
        }
        else {
            return "";
        }
    };
    ODataVisitor.prototype.ascending = function (propertyObject) {
        return propertyObject.namespace + " asc";
    };
    ODataVisitor.prototype.descending = function (propertyObject) {
        return propertyObject.namespace + " desc";
    };
    ODataVisitor.prototype.orderBy = function () {
        var result = Array.prototype.slice.call(arguments, 0);
        var stringResult = result.join(", ");
        return stringResult ? "$orderby=" + stringResult : "";
    };
    ODataVisitor.prototype.count = function (propertyObject, value) {
        return "$count=true";
    };
    ODataVisitor.prototype._and = function () {
        var children = Array.prototype.slice.call(arguments, 0);
        return children.join(" and ");
    };
    ODataVisitor.prototype.where = function () {
        var filterString = this["_and"].apply(this, arguments);
        if (filterString) {
            return "$filter=" + filterString;
        }
        else {
            return "";
        }
    };
    ODataVisitor.prototype.and = function () {
        if (arguments.length === 1) {
            return arguments[0];
        }
        var joined = this["_and"].apply(this, arguments);
        return "(" + joined + ")";
    };
    ODataVisitor.prototype.or = function () {
        var children = Array.prototype.slice.call(arguments, 0);
        if (children.length === 1) {
            return children[0];
        }
        return "(" + children.join(" or ") + ")";
    };
    ODataVisitor.prototype.equalTo = function (propertyObject, value) {
        return propertyObject.namespace + " eq " + this.getValue(propertyObject.property, value);
    };
    ODataVisitor.prototype.notEqualTo = function (propertyObject, value) {
        return propertyObject.namespace + " ne " + this.getValue(propertyObject.property, value);
    };
    ODataVisitor.prototype.constant = function (expression) {
        return expression.value;
    };
    ODataVisitor.prototype.property = function (expression) {
        return expression.value;
    };
    ODataVisitor.prototype.propertyAccess = function (left, property) {
        var properties;
        if (typeof left.value === "function") {
            var scope = this.scope ? this.scope + "/" : "";
            properties = getNavigationProperties(this.edm, this.model);
            if (properties[property]) {
                this.currentModel = properties[property];
            }
            return {
                namespace: scope + (this.convertPropertiesToPascalCase ? property.toPascalCase() : property),
                property: property
            };
        }
        else {
            properties = getNavigationProperties(this.edm, this.currentModel);
            if (properties[property]) {
                this.currentModel = properties[property];
            }
            return {
                namespace: left.namespace + "/" + (this.convertPropertiesToPascalCase ? property.toPascalCase() : property),
                property: property
            };
        }
    };
    ODataVisitor.prototype.type = function (type) {
        this.currentModel = this.model;
        return type;
    };
    ODataVisitor.prototype.guid = function (expression) {
        return expression.value;
    };
    ODataVisitor.prototype.substring = function (propertyObject, startAt, endAt) {
        return "substring(" + propertyObject.namespace + (startAt ? "," + startAt : "," + 0) + (endAt ? "," + endAt : "") + ")";
    };
    ODataVisitor.prototype.indexOf = function (propertyObject, value) {
        if (typeof value !== "string") {
            throw new Error("indexOf only allows strings.");
        }
        return "indexof(" + propertyObject.namespace + "," + this.getValue(propertyObject.property, value) + ")";
    };
    ODataVisitor.prototype.toUpper = function (propertyObject) {
        return "toupper(" + propertyObject.namespace + ")";
    };
    ODataVisitor.prototype.toLower = function (propertyObject) {
        return "tolower(" + propertyObject.namespace + ")";
    };
    ODataVisitor.prototype.trim = function (propertyObject) {
        return "trim(" + propertyObject.namespace + ")";
    };
    ODataVisitor.prototype.concat = function (propertyObject, value) {
        if (typeof value !== "string") {
            throw new Error("concat only allows strings.");
        }
        return "concat(" + propertyObject.namespace + "," + this.getValue(propertyObject.property, value) + ")";
    };
    ODataVisitor.prototype.substringOf = function (propertyObject, value) {
        if (typeof value !== "string") {
            throw new Error("substringOf only allows strings.");
        }
        return "contains(" + propertyObject.namespace + "," + this.getValue(propertyObject.property, value) + ")";
    };
    ODataVisitor.prototype.startsWith = function (propertyObject, value) {
        if (typeof value !== "string") {
            throw new Error("startsWith only allows strings.");
        }
        return "startswith(" + propertyObject.namespace + "," + this.getValue(propertyObject.property, value) + ")";
    };
    ODataVisitor.prototype.endsWith = function (propertyObject, value) {
        if (typeof value !== "string") {
            throw new Error("endsWith only allows strings.");
        }
        return "endswith(" + propertyObject.namespace + "," + this.getValue(propertyObject.property, value) + ")";
    };
    ODataVisitor.prototype.null = function (expression) {
        return null;
    };
    ODataVisitor.prototype.object = function (expression) {
        return expression.value;
    };
    ODataVisitor.prototype.undefined = function (expression) {
        return expression.value;
    };
    ODataVisitor.prototype.date = function (expression) {
        return expression.value;
    };
    ODataVisitor.prototype.string = function (expression) {
        return expression.value;
    };
    ODataVisitor.prototype.number = function (expression) {
        return expression.value;
    };
    ODataVisitor.prototype.boolean = function (expression) {
        return expression.value;
    };
    ODataVisitor.prototype.all = function (propertyObject, expression) {
        var config = buildConfigForOneToManyTraversing(this.config, propertyObject.property);
        var parser = new ODataVisitor(config);
        return propertyObject.namespace + "/all(entity: " + parser.parse(expression) + ")";
    };
    ODataVisitor.prototype.any = function (propertyObject, expression) {
        var config = buildConfigForOneToManyTraversing(this.config, propertyObject.property);
        var parser = new ODataVisitor(config);
        return propertyObject.namespace + "/any(entity: " + parser.parse(expression) + ")";
    };
    ODataVisitor.prototype.expression = function (expression) {
        return expression.value;
    };
    ODataVisitor.prototype.array = function (expression) {
        return expression.value;
    };
    ODataVisitor.prototype.greaterThan = function (propertyObject, value) {
        return propertyObject.namespace + " gt " + this.getValue(propertyObject.property, value);
    };
    ODataVisitor.prototype.has = function (propertyObject, value) {
        return propertyObject.namespace + " has " + value;
    };
    ODataVisitor.prototype.lessThan = function (propertyObject, value) {
        return propertyObject.namespace + " lt " + this.getValue(propertyObject.property, value);
    };
    ODataVisitor.prototype.greaterThanOrEqualTo = function (propertyObject, value) {
        return propertyObject.namespace + " ge " + this.getValue(propertyObject.property, value);
    };
    ODataVisitor.prototype.lessThanOrEqualTo = function (propertyObject, value) {
        return propertyObject.namespace + " le " + this.getValue(propertyObject.property, value);
    };
    ODataVisitor.prototype.not = function (expression) {
        return "not " + expression;
    };
    ODataVisitor.prototype.skip = function (value) {
        if (value === 0) {
            return "";
        }
        return "$skip=" + value;
    };
    ODataVisitor.prototype.take = function (value) {
        if (value === Infinity) {
            return "";
        }
        return "$top=" + value;
    };
    return ODataVisitor;
}(ExpressionVisitor));
module.exports = ODataVisitor;
//# sourceMappingURL=ODataVisitor.js.map