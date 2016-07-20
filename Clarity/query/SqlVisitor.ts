import ExpressionVisitor = require("ExpressionVisitor");

var escapeSingleQuotes = function (value) {
    if (typeof value !== "string") {
        value = value.toString();
    }

    return value.replace("'", "''");
};

var sqlizePrimitive = function (value) {

    if (typeof value === "string") {
        return "'" + escapeSingleQuotes(value) + "'";
    } else if (typeof value === "number") {
        return value.toString();
    } else if (typeof value === "boolean") {
        return value ? 1 : 0;
    } else if (value instanceof Date) {
        return value.getTime();
    }

};

class SqlVisitor extends ExpressionVisitor {
    model: any;
    tableName: any;

    constructor(tableName, model) {
        super();
        this.model = model;
        this.tableName = tableName;
    }

    isIn(property, array) {
        var self = this;
        return "(" + array.map(function (value) {
            return self.equalTo(property, value);
        }).join(" OR ") + ")";
    };

    isNotIn(property, array) {
        var self = this;
        return "(" + array.map((value) => {
            return this.notEqualTo(property, value);
        }).join(" AND ") + ")";
    };

    ascending(namespace) {
        return namespace + " ASC";
    }

    descending(namespace) {
        return namespace + " DESC";
    }

    orderBy() {
        var result = Array.prototype.slice.call(arguments, 0);
        return "ORDER BY " + result.join(", ");
    }

    count(left, right) {
        throw new Error("Not yet implemented.");
    }

    where() {
        var self = this;
        return "WHERE " + self["and"].apply(self, arguments);
    }

    and() {
        var children = Array.prototype.slice.call(arguments, 0);
        var result = [];
        children.forEach(function (expression, index) {
            result.push(expression);
            if (index !== children.length - 1) {
                result.push(" AND ");
            }
        });

        var joined = result.join("");

        if (joined === "") {
            return "";
        }

        return "(" + joined + ")";
    }

    or() {
        var children = Array.prototype.slice.call(arguments, 0);
        var result = [];
        children.forEach(function (expression, index) {
            result.push(expression);
            if (index !== children.length - 1) {
                result.push(" OR ");
            }
        });

        var joined = result.join("");

        if (joined === "") {
            return "";
        }

        return "(" + joined + ")";
    }

    equalTo(left, right) {
        if (right === null) {
            return left + " IS NULL";
        } else {
            return left + " = " + sqlizePrimitive(right);
        }
    }

    notEqualTo(left, right) {
        if (right === null) {
            return left + " IS NOT NULL";
        } else {
            return left + " <> " + sqlizePrimitive(right);
        }
    }

    greaterThan(left, right) {
        return left + " > " + sqlizePrimitive(right);
    }

    lessThan(left, right) {
        return left + " < " + sqlizePrimitive(right);
    }

    greaterThanOrEqualTo(left, right) {
        return left + " >= " + sqlizePrimitive(right);
    }

    lessThanOrEqualTo(left, right) {
        return left + " <= " + sqlizePrimitive(right);
    }

    not(left, right) {
        return left + " NOT " + right;
    }

    skip(value) {
        return " OFFSET " + value;
    }

    take(value) {
        if (value === Infinity) {
            return " LIMIT -1";
        } else {
            return " LIMIT " + value;
        }
    }

    constant(expression) {
        return expression.value;
    }

    property(expression) {
        var property = expression.value;
        return "\"" + property + "\"";
    }

    propertyAccess(type, property) {
        return property;
    }

    type(type) {
        return type;
    }

    substringOf(namespace, value) {
        return namespace + " LIKE '%" + escapeSingleQuotes(value) + "%'";
    }

    startsWith(namespace, value) {
        return namespace + " LIKE '" + escapeSingleQuotes(value) + "%'";
    }

    endsWith(namespace, value) {
        return namespace + " LIKE '%" + escapeSingleQuotes(value) + "'";
    }

    null(expression) {
        return null;
    }

    date(expression) {
        return sqlizePrimitive(expression.value);
    }

    string(expression) {
        return expression.value;
    }

    guid(expression) {
        return this.string(expression);
    }

    number(expression) {
        return expression.value;
    }

    boolean(expression) {
        return expression.value;
    }

    expression(expression) {
        return expression.value;
    }

    array(expression) {
        return expression.value;
    }

}

export = SqlVisitor;
