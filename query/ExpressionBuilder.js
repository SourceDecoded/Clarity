"use strict";
var ExpressionPackage = require("./Expression");
var Expression = ExpressionPackage.Expression;
var OperationExpression = ExpressionPackage.OperationExpression;
var ValueExpression = ExpressionPackage.ValueExpression;
var OperationExpressionBuilder = (function () {
    function OperationExpressionBuilder(getLeftExpression) {
        this.getLeftExpression = getLeftExpression || function (expression) {
            return expression;
        };
    }
    OperationExpressionBuilder.prototype.any = function (fn) {
        var expressionBuilder = new ExpressionBuilder();
        var expression = fn(expressionBuilder);
        return OperationExpression.any(this.getLeftExpression(), expression);
    };
    OperationExpressionBuilder.prototype.where = function (fn) {
        var propertyAccessExpression = this.getLeftExpression();
        this.getLeftExpression = function () {
            var expressionBuilder = new ExpressionBuilder(Object);
            var expression = fn(expressionBuilder);
            return ValueExpression.queryable(propertyAccessExpression, OperationExpression.expression(OperationExpression.where(expression)));
        };
        return self;
    };
    OperationExpressionBuilder.prototype.all = function (fn) {
        var expressionBuilder = new ExpressionBuilder();
        var expression = fn(expressionBuilder);
        return OperationExpression.all(this.getLeftExpression(), expression);
    };
    OperationExpressionBuilder.prototype.isEqualTo = function (value) {
        var constant = ValueExpression.getExpressionType(value);
        return OperationExpression.equalTo(this.getLeftExpression(), constant);
    };
    OperationExpressionBuilder.prototype.isNotEqualTo = function (value) {
        var constant = ValueExpression.getExpressionType(value);
        return OperationExpression.notEqualTo(this.getLeftExpression(), constant);
    };
    OperationExpressionBuilder.prototype.contains = function (value) {
        var constant = ValueExpression.getExpressionType(value);
        return OperationExpression.substringOf(this.getLeftExpression(), constant);
    };
    OperationExpressionBuilder.prototype.isIn = function (array) {
        if (Array.isArray(array)) {
            return OperationExpression.isIn(this.getLeftExpression(), ValueExpression.array(array));
        }
        else {
            throw new Error("isIn is expecting to be passed an array!");
        }
    };
    OperationExpressionBuilder.prototype.isNotIn = function (array) {
        if (Array.isArray(array)) {
            return OperationExpression.isNotIn(this.getLeftExpression(), ValueExpression.array(array));
        }
        else {
            throw new Error("isNotIn is expecting to be passed an array!");
        }
    };
    OperationExpressionBuilder.prototype.isSubstringOf = function (value) {
        console.warn("isSubstringOf is deprecated, please us contains.");
        return OperationExpression.substringOf(this.getLeftExpression(), ValueExpression.string(value));
    };
    OperationExpressionBuilder.prototype.isGreaterThan = function (value) {
        var constant = ValueExpression.getExpressionType(value);
        return OperationExpression.greaterThan(this.getLeftExpression(), constant);
    };
    OperationExpressionBuilder.prototype.isGreaterThanOrEqualTo = function (value) {
        var constant = ValueExpression.getExpressionType(value);
        return OperationExpression.greaterThanOrEqualTo(this.getLeftExpression(), constant);
    };
    OperationExpressionBuilder.prototype.isLessThanOrEqualTo = function (value) {
        var constant = ValueExpression.getExpressionType(value);
        return OperationExpression.lessThanOrEqualTo(this.getLeftExpression(), constant);
    };
    OperationExpressionBuilder.prototype.isLessThan = function (value) {
        var constant = ValueExpression.getExpressionType(value);
        return OperationExpression.lessThan(this.getLeftExpression(), constant);
    };
    OperationExpressionBuilder.prototype.endsWith = function (value) {
        return OperationExpression.endsWith(this.getLeftExpression(), ValueExpression.string(value));
    };
    OperationExpressionBuilder.prototype.startsWith = function (value) {
        return OperationExpression.startsWith(this.getLeftExpression(), ValueExpression.string(value));
    };
    OperationExpressionBuilder.prototype.property = function (value) {
        var _this = this;
        return new OperationExpressionBuilder(function () {
            return OperationExpression.propertyAccess(_this.getLeftExpression(), value);
        });
    };
    OperationExpressionBuilder.prototype.getExpression = function () {
        return this.getLeftExpression();
    };
    return OperationExpressionBuilder;
}());
var ExpressionBuilder = (function () {
    function ExpressionBuilder(Type) {
        this.Type || Object;
    }
    ExpressionBuilder.prototype.property = function (property) {
        var _this = this;
        return new OperationExpressionBuilder(function () {
            return OperationExpression.propertyAccess(ValueExpression.type(_this.Type), property);
        });
    };
    ExpressionBuilder.prototype.and = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i - 0] = arguments[_i];
        }
        return OperationExpression.and.apply(Expression, arguments);
    };
    ExpressionBuilder.prototype.or = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i - 0] = arguments[_i];
        }
        return OperationExpression.or.apply(Expression, arguments);
    };
    ExpressionBuilder.prototype.value = function () {
        return new OperationExpressionBuilder(function () {
            return ValueExpression.type(this.Type);
        });
    };
    return ExpressionBuilder;
}());
module.exports = ExpressionBuilder;
//# sourceMappingURL=ExpressionBuilder.js.map