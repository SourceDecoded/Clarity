import ExpressionVisitor = require("../query/ExpressionVisitor");
import indexOfByFunction = require("../array/indexOfByFunction");
import ODataAnnotation = require("./ODataAnnotation");
import toCamelCase = require("../string/toCamelCase");
import toPascalCase = require("../string/toPascalCase");
import EdmPackage = require("../data/Edm");
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
    var config = <any>{};

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

class ODataVisitor extends ExpressionVisitor {
    currentModel;
    edm;
    toServiceNamespace;
    model;
    config;
    scope;
    convertPropertiesToPascalCase: boolean;

    constructor(config) {
        super();

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

    getValue(key, value) {
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
            } else if (property.type === EdmPackage.Enum) {
                if (typeof value !== "number" && !(value instanceof Number)) {
                    throw new Error("The value for an enum needs to be a number. The property is '" + key + "'.");
                }

                return getOdataNamespace(property.genericTypeParameters[0]) + "'" + value.toEnumString(property.genericTypeParameters[0]) + "'";
            } else if (property.type === EdmPackage.EnumFlag) {
                if (typeof value !== "number" && !(value instanceof Number)) {
                    throw new Error("The value for an enum flag needs to be a number. The property is '" + key + "'.");
                }

                return getOdataNamespace(property.genericTypeParameters[0]) + "'" + value.toEnumFlagString(property.genericTypeParameters[0]) + "'";
            } else if (property.type === Number) {
                return value.toString();
            } else if (property.type === String) {
                var escapedString = value.replace(/'/g, "''").replace(/\&/g, "%26").replace(/\#/g, "%23");
                return "'" + escapedString + "'";
            } else if (property.type === Boolean) {
                return value.toString();
            } else {
                return value;
            }

        } else {
            throw new Error("Couldn't find a '" + key + "' property definitions on '" + this.model.collectionName + "'.");
        }
    }

    isIn(propertyObject, array) {
        var self = this;
        if (array.length > 0) {
            return "(" + array.map(function (value) {
                return propertyObject.namespace + " eq " + self.getValue(propertyObject.property, value);
            }).join(" or ") + ")";
        } else {
            return "";
        }
    }

    isNotIn(propertyObject, array) {
        var self = this;
        if (array.length > 0) {
            return "(" + array.map(function (value) {
                return propertyObject.namespace + " ne " + self.getValue(propertyObject.property, value);
            }).join(" and ") + ")";
        } else {
            return "";
        }
    }

    ascending(propertyObject) {
        return propertyObject.namespace + " asc";
    }

    descending(propertyObject) {
        return propertyObject.namespace + " desc";
    }

    orderBy() {
        var result = Array.prototype.slice.call(arguments, 0);
        var stringResult = result.join(", ");
        return stringResult ? "$orderby=" + stringResult : "";
    }

    count(propertyObject, value) {
        return "$count=true";
    }

    _and() {
        var children = Array.prototype.slice.call(arguments, 0);
        return children.join(" and ");
    }

    where() {
        var filterString = this["_and"].apply(this, arguments);

        if (filterString) {
            return "$filter=" + filterString;
        } else {
            return "";
        }
    }

    and() {
        if (arguments.length === 1) {
            return arguments[0];
        }

        var joined = this["_and"].apply(this, arguments);

        return "(" + joined + ")";
    }

    or() {
        var children = Array.prototype.slice.call(arguments, 0);
        if (children.length === 1) {
            return children[0];
        }

        return "(" + children.join(" or ") + ")";
    }

    equalTo(propertyObject, value) {
        return propertyObject.namespace + " eq " + this.getValue(propertyObject.property, value);
    }

    notEqualTo(propertyObject, value) {
        return propertyObject.namespace + " ne " + this.getValue(propertyObject.property, value);
    }

    constant(expression) {
        return expression.value;
    }

    property(expression) {
        return expression.value;
    }

    propertyAccess(left, property) {
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

        } else {

            properties = getNavigationProperties(this.edm, this.currentModel);

            if (properties[property]) {
                this.currentModel = properties[property];
            }

            return {
                namespace: left.namespace + "/" + (this.convertPropertiesToPascalCase ? property.toPascalCase() : property),
                property: property
            };

        }
    }

    type(type) {
        this.currentModel = this.model;
        return type;
    }

    guid(expression) {
        return expression.value;
    }

    substring(propertyObject, startAt, endAt) {
        return "substring(" + propertyObject.namespace + (startAt ? "," + startAt : "," + 0) + (endAt ? "," + endAt : "") + ")";
    }

    indexOf(propertyObject, value) {
        if (typeof value !== "string") {
            throw new Error("indexOf only allows strings.");
        }

        return "indexof(" + propertyObject.namespace + "," + this.getValue(propertyObject.property, value) + ")";
    }

    toUpper(propertyObject) {
        return "toupper(" + propertyObject.namespace + ")";
    }

    toLower(propertyObject) {
        return "tolower(" + propertyObject.namespace + ")";
    }

    trim(propertyObject) {
        return "trim(" + propertyObject.namespace + ")";
    }

    concat(propertyObject, value) {
        if (typeof value !== "string") {
            throw new Error("concat only allows strings.");
        }

        return "concat(" + propertyObject.namespace + "," + this.getValue(propertyObject.property, value) + ")";
    }

    substringOf(propertyObject, value) {
        if (typeof value !== "string") {
            throw new Error("substringOf only allows strings.");
        }

        return "contains(" + propertyObject.namespace + "," + this.getValue(propertyObject.property, value) + ")";
    }

    startsWith(propertyObject, value) {
        if (typeof value !== "string") {
            throw new Error("startsWith only allows strings.");
        }

        return "startswith(" + propertyObject.namespace + "," + this.getValue(propertyObject.property, value) + ")";
    }

    endsWith(propertyObject, value) {
        if (typeof value !== "string") {
            throw new Error("endsWith only allows strings.");
        }

        return "endswith(" + propertyObject.namespace + "," + this.getValue(propertyObject.property, value) + ")";
    }

    null(expression) {
        return null;
    }

    object(expression) {
        return expression.value;
    }

    undefined(expression) {
        return expression.value;
    }

    date(expression) {
        return expression.value;
    }

    string(expression) {
        return expression.value;
    }

    number(expression) {
        return expression.value;
    }

    boolean(expression) {
        return expression.value;
    }

    all(propertyObject, expression) {
        var config = buildConfigForOneToManyTraversing(this.config, propertyObject.property);
        var parser = new ODataVisitor(config);
        return propertyObject.namespace + "/all(entity: " + parser.parse(expression) + ")";
    }

    any(propertyObject, expression) {
        var config = buildConfigForOneToManyTraversing(this.config, propertyObject.property);
        var parser = new ODataVisitor(config);
        return propertyObject.namespace + "/any(entity: " + parser.parse(expression) + ")";
    }

    expression(expression) {
        return expression.value;
    }

    array(expression) {
        return expression.value;
    }

    greaterThan(propertyObject, value) {
        return propertyObject.namespace + " gt " + this.getValue(propertyObject.property, value);
    }

    has(propertyObject, value) {
        return propertyObject.namespace + " has " + value;
    }

    lessThan(propertyObject, value) {
        return propertyObject.namespace + " lt " + this.getValue(propertyObject.property, value);
    }

    greaterThanOrEqualTo(propertyObject, value) {
        return propertyObject.namespace + " ge " + this.getValue(propertyObject.property, value);
    }

    lessThanOrEqualTo(propertyObject, value) {
        return propertyObject.namespace + " le " + this.getValue(propertyObject.property, value);
    }

    not(expression) {
        return "not " + expression;
    }

    skip(value) {
        if (value === 0) {
            return "";
        }
        return "$skip=" + value;
    }

    take(value) {
        if (value === Infinity) {
            return "";
        }
        return "$top=" + value;
    }
}

export = ODataVisitor;

