"use strict";
var ExpressionPackage = require("./Expression");
var Expression = ExpressionPackage.Expression;
var ExpressionVisitor = (function () {
    function ExpressionVisitor() {
    }
    ExpressionVisitor.prototype.parse = function (expression) {
        var _this = this;
        var self = this;
        if (!expression) {
            return null;
        }
        var children = [];
        expression.children.forEach(function (expression) {
            if (!expression.children) {
                children.push(expression);
            }
            else {
                children.push(_this.parse(expression));
            }
        });
        var func = this[expression.nodeName];
        if (!func) {
            throw new Error("The builder doesn't support the \"" + expression.nodeName + "\" expression.");
        }
        children.forEach(function (child, index) {
            if (child instanceof Expression) {
                var func = _this[child.nodeName];
                if (!func) {
                    throw new Error("The builder doesn't support the \"" + child.nodeName + "\" expression.");
                }
                children[index] = func.call(self, child);
            }
        });
        return func.apply(self, children);
    };
    ;
    return ExpressionVisitor;
}());
module.exports = ExpressionVisitor;
//# sourceMappingURL=ExpressionVisitor.js.map