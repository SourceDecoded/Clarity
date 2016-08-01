"use strict";
const ExpressionPackage = require("./Expression");
var Expression = ExpressionPackage.Expression;
var OperationExpression = ExpressionPackage.OperationExpression;
var ValueExpression = ExpressionPackage.ValueExpression;
class OperationExpressionBuilder {
    constructor(getLeftExpression) {
        this.getLeftExpression = getLeftExpression || function (expression) {
            return expression;
        };
    }
    any(fn) {
        var expressionBuilder = new ExpressionBuilder();
        var expression = fn(expressionBuilder);
        return OperationExpression.any(this.getLeftExpression(), expression);
    }
    where(fn) {
        var propertyAccessExpression = this.getLeftExpression();
        this.getLeftExpression = function () {
            var expressionBuilder = new ExpressionBuilder(Object);
            var expression = fn(expressionBuilder);
            return ValueExpression.queryable(propertyAccessExpression, OperationExpression.expression(OperationExpression.where(expression)));
        };
        return self;
    }
    all(fn) {
        var expressionBuilder = new ExpressionBuilder();
        var expression = fn(expressionBuilder);
        return OperationExpression.all(this.getLeftExpression(), expression);
    }
    isEqualTo(value) {
        var constant = ValueExpression.getExpressionType(value);
        return OperationExpression.equalTo(this.getLeftExpression(), constant);
    }
    isNotEqualTo(value) {
        var constant = ValueExpression.getExpressionType(value);
        return OperationExpression.notEqualTo(this.getLeftExpression(), constant);
    }
    contains(value) {
        var constant = ValueExpression.getExpressionType(value);
        return OperationExpression.substringOf(this.getLeftExpression(), constant);
    }
    isIn(array) {
        if (Array.isArray(array)) {
            return OperationExpression.isIn(this.getLeftExpression(), ValueExpression.array(array));
        }
        else {
            throw new Error("isIn is expecting to be passed an array!");
        }
    }
    isNotIn(array) {
        if (Array.isArray(array)) {
            return OperationExpression.isNotIn(this.getLeftExpression(), ValueExpression.array(array));
        }
        else {
            throw new Error("isNotIn is expecting to be passed an array!");
        }
    }
    isSubstringOf(value) {
        console.warn("isSubstringOf is deprecated, please us contains.");
        return OperationExpression.substringOf(this.getLeftExpression(), ValueExpression.string(value));
    }
    isGreaterThan(value) {
        var constant = ValueExpression.getExpressionType(value);
        return OperationExpression.greaterThan(this.getLeftExpression(), constant);
    }
    isGreaterThanOrEqualTo(value) {
        var constant = ValueExpression.getExpressionType(value);
        return OperationExpression.greaterThanOrEqualTo(this.getLeftExpression(), constant);
    }
    isLessThanOrEqualTo(value) {
        var constant = ValueExpression.getExpressionType(value);
        return OperationExpression.lessThanOrEqualTo(this.getLeftExpression(), constant);
    }
    isLessThan(value) {
        var constant = ValueExpression.getExpressionType(value);
        return OperationExpression.lessThan(this.getLeftExpression(), constant);
    }
    endsWith(value) {
        return OperationExpression.endsWith(this.getLeftExpression(), ValueExpression.string(value));
    }
    startsWith(value) {
        return OperationExpression.startsWith(this.getLeftExpression(), ValueExpression.string(value));
    }
    property(value) {
        return new OperationExpressionBuilder(() => {
            return OperationExpression.propertyAccess(this.getLeftExpression(), value);
        });
    }
    getExpression() {
        return this.getLeftExpression();
    }
}
class ExpressionBuilder {
    constructor(Type) {
        this.Type || Object;
    }
    property(property) {
        return new OperationExpressionBuilder(() => {
            return OperationExpression.propertyAccess(ValueExpression.type(this.Type), property);
        });
    }
    and(...args) {
        return OperationExpression.and.apply(Expression, arguments);
    }
    or(...args) {
        return OperationExpression.or.apply(Expression, arguments);
    }
    value() {
        return new OperationExpressionBuilder(function () {
            return ValueExpression.type(this.Type);
        });
    }
}
module.exports = ExpressionBuilder;
//# sourceMappingURL=ExpressionBuilder.js.map