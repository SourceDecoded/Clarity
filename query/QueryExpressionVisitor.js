"use strict";
class QueryExpressionVisitor {
    constructor(reduceVisitor) {
        this.reduceVisitor = reduceVisitor;
    }
    program(programNode) {
        programNode.body.forEach(function (childNode) {
            var methodName = childNode.type.toCamelCase();
            if (typeof childNode.type.toCamelCase() !== "function") {
                throw new Error("Unknown expression: " + childNode.type);
            }
            this[methodName](childNode);
        });
    }
    binaryExpression(binaryNode) {
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
    }
    blockStatement(blockNode) {
        blockNode.body.forEach(function (programNode) {
            var methodName = programNode.type.toCamelCase();
            if (typeof programNode.type.toCamelCase() !== "function") {
                throw new Error("Unknown expression: " + programNode.type);
            }
            this[methodName](programNode);
        });
    }
    returnStatement() {
    }
    logicalExpression() {
    }
    memberExpression() {
    }
    identifier() {
    }
    literal() {
    }
    callExpression() {
    }
}
module.exports = QueryExpressionVisitor;
//# sourceMappingURL=QueryExpressionVisitor.js.map