"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var Expression = (function () {
    function Expression(nodeName) {
        this.nodeName = "expression";
        this.nodeName = nodeName;
    }
    Expression.prototype.copy = function () {
        throw new Error("Meant to be overriden");
    };
    Expression.prototype.isEqualTo = function (node) {
        throw new Error("Meant to be overriden");
    };
    return Expression;
}());
exports.Expression = Expression;
var ValueExpression = (function (_super) {
    __extends(ValueExpression, _super);
    function ValueExpression(nodeName, value) {
        _super.call(this, nodeName);
        this.value = null;
        this.value = value;
    }
    ValueExpression.prototype.copy = function () {
        return new ValueExpression(this.nodeName, this.value);
    };
    ;
    ValueExpression.prototype.isEqualTo = function (node) {
        if (node && this.nodeName === node.nodeName && this.value === node.value) {
            return true;
        }
        return false;
    };
    ;
    ValueExpression.prototype.contains = function (node) {
        return this.isEqualTo(node);
    };
    ValueExpression.getExpressionType = function (value) {
        if (value instanceof Expression) {
            return value;
        }
        if (typeof value === "string") {
            return ValueExpression.string(value);
        }
        else if (typeof value === "function") {
            return ValueExpression.function(value);
        }
        else if (typeof value === "number") {
            return ValueExpression.number(value);
        }
        else if (typeof value === "boolean") {
            return ValueExpression.boolean(value);
        }
        else if (value === null) {
            return ValueExpression.null(value);
        }
        else if (typeof value === "undefined") {
            return ValueExpression.undefined(value);
        }
        else if (Array.isArray(value)) {
            return ValueExpression.array(value);
        }
        else if (value instanceof Date) {
            return ValueExpression.date(value);
        }
        else {
            return ValueExpression.object(value);
        }
    };
    ValueExpression.property = function (value) {
        return new ValueExpression("property", value);
    };
    ;
    ValueExpression.constant = function (value) {
        return new ValueExpression("constant", value);
    };
    ;
    ValueExpression.boolean = function (value) {
        var expression = new ValueExpression("boolean");
        expression.value = value;
        return expression;
    };
    ;
    ValueExpression.string = function (value) {
        var expression = new ValueExpression("string");
        expression.value = value;
        return expression;
    };
    ;
    ValueExpression.number = function (value) {
        var expression = new ValueExpression("number");
        expression.value = value;
        return expression;
    };
    ;
    ValueExpression.object = function (value) {
        var expression = new ValueExpression("object");
        expression.value = value;
        return expression;
    };
    ;
    ValueExpression.date = function (value) {
        var expression = new ValueExpression("date");
        expression.value = value;
        return expression;
    };
    ;
    ValueExpression.function = function (value) {
        var expression = new ValueExpression("function");
        expression.value = value;
        return expression;
    };
    ;
    ValueExpression.type = function (value) {
        var expression = new ValueExpression("type");
        expression.value = value || Object;
        return expression;
    };
    ;
    ValueExpression.null = function (value) {
        var expression = new ValueExpression("null");
        expression.value = value;
        return expression;
    };
    ;
    ValueExpression.undefined = function (value) {
        var expression = new ValueExpression("undefined");
        expression.value = value;
        return expression;
    };
    ;
    ValueExpression.array = function (value) {
        var expression = new ValueExpression("array");
        expression.value = value;
        return expression;
    };
    ;
    ValueExpression.queryable = function (leftExpression, rightExpression) {
        var expression = new OperationExpression("queryable");
        expression.children.push(leftExpression, rightExpression);
        return expression;
    };
    ;
    return ValueExpression;
}(Expression));
exports.ValueExpression = ValueExpression;
var OperationExpression = (function (_super) {
    __extends(OperationExpression, _super);
    function OperationExpression(nodeName) {
        _super.call(this, nodeName);
        this.children = [];
    }
    OperationExpression.prototype.copy = function () {
        var children = [];
        var copy = new OperationExpression(this.nodeName);
        this.children.forEach(function (expression) {
            copy.children.push(expression.copy());
        });
        return copy;
    };
    OperationExpression.prototype.isEqualTo = function (node) {
        if (!Array.isArray(node.children) || this.nodeName !== node.nodeName) {
            return false;
        }
        if (node.children.length !== this.children.length) {
            return false;
        }
        return this.children.every(function (expression, index) {
            return expression.isEqualTo(node.children[index]);
        });
    };
    OperationExpression.prototype.contains = function (node) {
        var _this = this;
        if (node.nodeName === this.nodeName && Array.isArray(node.children)) {
            var matched = node.children.every(function (childNode, index) {
                return childNode.contains(_this.children[index]);
            });
            if (matched) {
                return true;
            }
        }
        return this.children.some(function (childNode) {
            return childNode.contains(node);
        });
    };
    OperationExpression.prototype.getMatchingNodes = function (node, matchedNodes) {
        var _this = this;
        matchedNodes = Array.isArray(matchedNodes) ? matchedNodes : [];
        if (node.nodeName === this.nodeName && Array.isArray(node.children)) {
            var matched = node.children.every(function (childNode, index) {
                return childNode.contains(_this.children[index], matchedNodes);
            });
            if (matched) {
                matchedNodes.push(this);
            }
        }
        this.children.forEach(function (childNode) {
            if (Array.isArray(childNode.children)) {
                childNode.getMatchingNodes(node, matchedNodes);
            }
        }, matchedNodes);
        return matchedNodes;
    };
    OperationExpression.equalTo = function (left, right) {
        var expression = new OperationExpression("equalTo");
        Array.prototype.slice.call(arguments, 0).forEach(function (arg) {
            expression.children.push(arg);
        });
        return expression;
    };
    ;
    OperationExpression.notEqualTo = function (left, right) {
        var expression = new OperationExpression("notEqualTo");
        Array.prototype.slice.call(arguments, 0).forEach(function (arg) {
            expression.children.push(arg);
        });
        return expression;
    };
    ;
    OperationExpression.or = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i - 0] = arguments[_i];
        }
        var expression = new OperationExpression("or");
        Array.prototype.slice.call(arguments, 0).forEach(function (arg) {
            expression.children.push(arg);
        });
        return expression;
    };
    ;
    OperationExpression.and = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i - 0] = arguments[_i];
        }
        var expression = new OperationExpression("and");
        Array.prototype.slice.call(arguments, 0).forEach(function (arg) {
            expression.children.push(arg);
        });
        return expression;
    };
    ;
    OperationExpression.where = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i - 0] = arguments[_i];
        }
        var expression = new OperationExpression("where");
        Array.prototype.slice.call(arguments, 0).forEach(function (arg) {
            expression.children.push(arg);
        });
        return expression;
    };
    ;
    OperationExpression.greaterThan = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i - 0] = arguments[_i];
        }
        var expression = new OperationExpression("greaterThan");
        Array.prototype.slice.call(arguments, 0).forEach(function (arg) {
            expression.children.push(arg);
        });
        return expression;
    };
    ;
    OperationExpression.lessThan = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i - 0] = arguments[_i];
        }
        var expression = new OperationExpression("lessThan");
        Array.prototype.slice.call(arguments, 0).forEach(function (arg) {
            expression.children.push(arg);
        });
        return expression;
    };
    ;
    OperationExpression.greaterThanOrEqualTo = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i - 0] = arguments[_i];
        }
        var expression = new OperationExpression("greaterThanOrEqualTo");
        Array.prototype.slice.call(arguments, 0).forEach(function (arg) {
            expression.children.push(arg);
        });
        return expression;
    };
    ;
    OperationExpression.lessThanOrEqualTo = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i - 0] = arguments[_i];
        }
        var expression = new OperationExpression("lessThanOrEqualTo");
        Array.prototype.slice.call(arguments, 0).forEach(function (arg) {
            expression.children.push(arg);
        });
        return expression;
    };
    ;
    OperationExpression.orderBy = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i - 0] = arguments[_i];
        }
        var expression = new OperationExpression("orderBy");
        Array.prototype.slice.call(arguments, 0).forEach(function (arg) {
            expression.children.push(arg);
        });
        return expression;
    };
    ;
    OperationExpression.descending = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i - 0] = arguments[_i];
        }
        var expression = new OperationExpression("descending");
        Array.prototype.slice.call(arguments, 0).forEach(function (arg) {
            expression.children.push(arg);
        });
        return expression;
    };
    ;
    OperationExpression.ascending = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i - 0] = arguments[_i];
        }
        var expression = new OperationExpression("ascending");
        Array.prototype.slice.call(arguments, 0).forEach(function (arg) {
            expression.children.push(arg);
        });
        return expression;
    };
    ;
    OperationExpression.skip = function (value) {
        var expression = new OperationExpression("skip");
        var valueExpression = ValueExpression.constant(value);
        expression.children.push(valueExpression);
        return expression;
    };
    ;
    OperationExpression.take = function (value) {
        var expression = new OperationExpression("take");
        var valueExpression = ValueExpression.constant(value);
        expression.children.push(valueExpression);
        return expression;
    };
    ;
    OperationExpression.buildOperatorExpression = function (name) {
        var expression = new OperationExpression(name);
        var args = Array.prototype.slice.call(arguments, 1);
        args.forEach(function (arg) {
            expression.children.push(arg);
        });
        return expression;
    };
    ;
    OperationExpression.guid = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i - 0] = arguments[_i];
        }
        var expression = new OperationExpression("guid");
        Array.prototype.slice.call(arguments, 0).forEach(function (arg) {
            expression.children.push(arg);
        });
        return expression;
    };
    ;
    OperationExpression.substring = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i - 0] = arguments[_i];
        }
        var expression = new OperationExpression("substring");
        Array.prototype.slice.call(arguments, 0).forEach(function (arg) {
            expression.children.push(arg);
        });
        return expression;
    };
    ;
    OperationExpression.substringOf = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i - 0] = arguments[_i];
        }
        var expression = new OperationExpression("substringOf");
        Array.prototype.slice.call(arguments, 0).forEach(function (arg) {
            expression.children.push(arg);
        });
        return expression;
    };
    ;
    OperationExpression.startsWith = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i - 0] = arguments[_i];
        }
        var expression = new OperationExpression("startsWith");
        Array.prototype.slice.call(arguments, 0).forEach(function (arg) {
            expression.children.push(arg);
        });
        return expression;
    };
    ;
    OperationExpression.endsWith = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i - 0] = arguments[_i];
        }
        var expression = new OperationExpression("endsWith");
        Array.prototype.slice.call(arguments, 0).forEach(function (arg) {
            expression.children.push(arg);
        });
        return expression;
    };
    ;
    OperationExpression.isIn = function (property, array) {
        var expression = new OperationExpression("isIn");
        Array.prototype.slice.call(arguments, 0).forEach(function (arg) {
            expression.children.push(arg);
        });
        return expression;
    };
    ;
    OperationExpression.isNotIn = function (property, array) {
        var expression = new OperationExpression("isNotIn");
        Array.prototype.slice.call(arguments, 0).forEach(function (arg) {
            expression.children.push(arg);
        });
        return expression;
    };
    ;
    OperationExpression.include = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i - 0] = arguments[_i];
        }
        var expression = new OperationExpression("include");
        Array.prototype.slice.call(arguments, 0).forEach(function (arg) {
            expression.children.push(arg);
        });
        return expression;
    };
    ;
    OperationExpression.any = function (propertyAccessExpression, expression) {
        var anyExpression = new OperationExpression("any");
        var expressionExpression = OperationExpression.expression(expression);
        anyExpression.children.push(propertyAccessExpression, expressionExpression);
        return anyExpression;
    };
    ;
    OperationExpression.all = function (propertyAccessExpression, expression) {
        var allExpression = new OperationExpression("all");
        var expressionExpression = OperationExpression.expression(expression);
        allExpression.children.push(propertyAccessExpression, expressionExpression);
        return allExpression;
    };
    ;
    OperationExpression.expression = function (value) {
        var expresssionExpression = new ValueExpression("expression", value);
        return expresssionExpression;
    };
    ;
    OperationExpression.propertyAccess = function (leftExpression, propertyName) {
        var propertyExpression = ValueExpression.property(propertyName);
        var propertyAccessExpression = new OperationExpression("propertyAccess");
        propertyAccessExpression.children.push(leftExpression, propertyExpression);
        return propertyAccessExpression;
    };
    ;
    OperationExpression.contains = function (Type, namespace, expression) {
        var containsExpression = new OperationExpression("contains");
        var ofTypeExpression = new ValueExpression("ofType", Type);
        var propertyExpression = new ValueExpression("property", namespace);
        containsExpression.children.push(ofTypeExpression, propertyExpression, expression);
        return containsExpression;
    };
    ;
    OperationExpression.intersects = function (Type, namespace, expression) {
        var intersectsExpression = new OperationExpression("intersects");
        var ofTypeExpression = new ValueExpression("ofType", Type);
        var propertyExpression = new ValueExpression("property", namespace);
        intersectsExpression.children.push(ofTypeExpression, propertyExpression, expression);
        return intersectsExpression;
    };
    ;
    return OperationExpression;
}(Expression));
exports.OperationExpression = OperationExpression;
//# sourceMappingURL=Expression.js.map