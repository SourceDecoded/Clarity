import ExpressionVisitor = require("./ExpressionVisitor");

var singleQuotesRegEx = /\'/gi;
var backSlashRegEx = /\\/gi;

var escapeSpecialCharacters = function (value) {
    if (typeof value !== "string") {
        value = value.toString();
    }

    return value.replace(backSlashRegEx, "\\\\").replace(singleQuotesRegEx, "\\'");
};

var toJavascriptValue = function (value) {
    if (typeof value === "string") {
        return "'" + escapeSpecialCharacters(value) + "'";
    } else if (typeof value === "number") {
        return value.toString();
    } else if (typeof value === "boolean") {
        return value ? "true" : "false";
    } else if (value instanceof Date) {
        return "new Date(" + value.getTime() + ")";
    }
};

class ArrayVisitor extends ExpressionVisitor {

    createGetPropertyValue(property) {
        return "function(entity){return " + property + ";}";
    };

    isIn(left, array) {
        return "(" + array.map(function (value) {
            return left + " === " + toJavascriptValue(value);
        }).join(" || ") + ")";
    }

    isNotIn(left, array) {
        return "(" + array.map(function (value) {
            return left + " !== " + toJavascriptValue(value);
        }).join(" && ") + ")";
    }

    ascending(namespace) {
        return "function(itemA, itemB){ var a = (" + this.createGetPropertyValue(namespace) + ")(itemA); if (typeof a === 'string'){ a = a.toLowerCase();  } var b = (" + this.createGetPropertyValue(namespace) + ")(itemB); if (typeof b === 'string'){ b = b.toLowerCase();  } if (a === b){ return 0; } else if (a < b){ return -1; } else if (a > b){ return 1; }}";
    }

    descending(namespace) {
        return "function(itemA, itemB){ var a = (" + this.createGetPropertyValue(namespace) + ")(itemA); if (typeof a === 'string'){ a = a.toLowerCase();  } var b = (" + this.createGetPropertyValue(namespace) + ")(itemB); if (typeof b === 'string'){ b = b.toLowerCase();  } if (a === b){ return 0; } else if (a > b){ return -1; } else if (a < b){ return 1; }}";
    }

    orderBy() {
        var result = Array.prototype.slice.call(arguments, 0);
        var fnString;

        if (result.length > 0) {
            fnString = "var returnValue = 0;";
            fnString += "[" + result.join(", ") + "]";
            fnString += ".every(function(orderBy){ returnValue = orderBy(itemA, itemB);  if (returnValue===0){return true;} else {return false;} });";
            fnString += " return returnValue;";
            return new Function("itemA", "itemB", fnString);
        } else {
            return function (a, b) { return -1 };
        }
    }

    where() {
        return new Function("entity", "return " + (this["and"].apply(this, arguments) || "true") + ";");
    }

    and() {
        var children = Array.prototype.slice.call(arguments, 0);

        children = children.filter(function (expression) {
            return expression ? true : false;
        });

        var joined = children.join(" && ");

        if (joined === "") {
            return "";
        }

        return "(" + joined + ")";
    }

    or() {
        var children = Array.prototype.slice.call(arguments, 0);
        children = children.filter(function (expression) {
            return expression ? true : false;
        });

        var joined = children.join(" || ");

        if (joined === "") {
            return "";
        }

        return "(" + joined + ")";
    }

    equalTo(left, right) {
        return left + " === " + right;
    }

    notEqualTo(left, right) {
        return left + " !== " + right;
    }

    greaterThan(left, right) {
        return left + " > " + right;
    }

    lessThan(left, right) {
        return left + " < " + right;
    }

    greaterThanOrEqualTo(left, right) {
        return left + " >= " + right;
    }

    lessThanOrEqualTo(left, right) {
        return left + " <= " + right;
    }

    not(left, right) {
        return left + " !== " + right;
    }

    constant(expression) {
        return expression.value;
    }

    property(expression) {
        return expression.value;
    }

    propertyAccess(type, property) {
        return type + "['" + property + "']";
    }

    type(type) {
        return "entity";
    }

    substringOf(namespace, value) {
        return this.nullCheck(namespace, namespace + ".toLowerCase().indexOf(" + value.toLowerCase() + ") >= 0");
    }

    startsWith(namespace, value) {
        return this.nullCheck(namespace, namespace + ".toLowerCase().indexOf(" + value.toLowerCase() + ") === 0");
    }

    endsWith(namespace, value) {
        return this.nullCheck(namespace, namespace + ".toLowerCase().indexOf(" + value.toLowerCase() + ") === " + namespace + ".length - " + (value.length - 2));
    }

    null(expression) {
        return "null";
    }

    date(expression) {
        return toJavascriptValue(expression.value);
    }

    string(expression) {
        return toJavascriptValue(expression.value);
    }

    guid(expression) {
        return this.string(expression);
    }

    number(expression) {
        return toJavascriptValue(expression.value);
    }

    boolean(expression) {
        return toJavascriptValue(expression.value);
    }

    nullCheck(namespace, stringExpression) {
        return namespace + " != null ? " + stringExpression + " : false";
    }

    array(expression) {
        return expression.value;
    }

    expression(expression) {
        return expression.value;
    }

}

export = ArrayVisitor;