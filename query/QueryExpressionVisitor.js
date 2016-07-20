"use strict";
var QueryExpressionVisitor = (function () {
    function QueryExpressionVisitor(reduceVisitor) {
        this.reduceVisitor = reduceVisitor;
    }
    QueryExpressionVisitor.prototype.program = function (programNode) {
        programNode.body.forEach(function (childNode) {
            var methodName = childNode.type.toCamelCase();
            if (typeof childNode.type.toCamelCase() !== "function") {
                throw new Error("Unknown expression: " + childNode.type);
            }
            this[methodName](childNode);
        });
    };
    QueryExpressionVisitor.prototype.binaryExpression = function (binaryNode) {
        var operator = binaryNode.operator;
        var leftSideExpression = binaryNode.left.type.toCamelCase();
        var rightSideExpression = binaryNode.right.type.toCamelCase();
        if (typeof this[leftSideExpression] !== "function") {
            throw new Error("Unknown expression: " + binaryNode.left.type);
        }
        if (typeof this[rightSideExpression] !== "function") {
            throw new Error("Unknown expression: " + binaryNode.right.type);
        }
        var leftValue = this[leftSideExpression](binaryNode.left);
        var rightValue = this[rightSideExpression](binaryNode.right);
        if (operator === "===") {
            return this.reduceVisitor.equalTo(leftValue, rightValue);
        }
        else if (operator === "==") {
            return this.reduceVisitor.equalTo(leftValue, rightValue);
        }
        else if (operator === "!==") {
            return this.reduceVisitor.equalTo(leftValue, rightValue);
        }
        else if (operator === "!=") {
            return this.reduceVisitor.equalTo(leftValue, rightValue);
        }
        else if (operator === ">") {
            return this.reduceVisitor.equalTo(leftValue, rightValue);
        }
        else if (operator === "<") {
            return this.reduceVisitor.equalTo(leftValue, rightValue);
        }
        else if (operator === ">=") {
            return this.reduceVisitor.equalTo(leftValue, rightValue);
        }
        else if (operator === "<=") {
            return this.reduceVisitor.equalTo(leftValue, rightValue);
        }
    };
    QueryExpressionVisitor.prototype.blockStatement = function (blockNode) {
        blockNode.body.forEach(function (programNode) {
            var methodName = programNode.type.toCamelCase();
            if (typeof programNode.type.toCamelCase() !== "function") {
                throw new Error("Unknown expression: " + programNode.type);
            }
            this[methodName](programNode);
        });
    };
    QueryExpressionVisitor.prototype.returnStatement = function () {
    };
    QueryExpressionVisitor.prototype.logicalExpression = function () {
    };
    QueryExpressionVisitor.prototype.memberExpression = function () {
    };
    QueryExpressionVisitor.prototype.identifier = function () {
    };
    QueryExpressionVisitor.prototype.literal = function () {
    };
    QueryExpressionVisitor.prototype.callExpression = function () {
    };
    return QueryExpressionVisitor;
}());
module.exports = QueryExpressionVisitor;
//# sourceMappingURL=QueryExpressionVisitor.js.map