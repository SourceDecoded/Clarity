"use strict";
const ExpressionPackage = require("./Expression");
var Expression = ExpressionPackage.Expression;
class ExpressionVisitor {
    parse(expression) {
        var self = this;
        if (!expression) {
            return null;
        }
        var children = [];
        expression.children.forEach((expression) => {
            if (!expression.children) {
                children.push(expression);
            }
            else {
                children.push(this.parse(expression));
            }
        });
        var func = this[expression.nodeName];
        if (!func) {
            throw new Error("The builder doesn't support the \"" + expression.nodeName + "\" expression.");
        }
        children.forEach((child, index) => {
            if (child instanceof Expression) {
                var func = this[child.nodeName];
                if (!func) {
                    throw new Error("The builder doesn't support the \"" + child.nodeName + "\" expression.");
                }
                children[index] = func.call(self, child);
            }
        });
        return func.apply(self, children);
    }
    ;
}
module.exports = ExpressionVisitor;
//# sourceMappingURL=ExpressionVisitor.js.map