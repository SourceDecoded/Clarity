export class Expression {
    nodeName: string = "expression";

    constructor(nodeName) {
        this.nodeName = nodeName;
    }

    copy(): Expression {
        throw new Error("Meant to be overriden");
    }

    isEqualTo(node: Expression): boolean {
        throw new Error("Meant to be overriden");
    }
}

export class ValueExpression extends Expression {
    value: any = null;
    constructor(nodeName: string, value?: any) {
        super(nodeName);
        this.value = value;
    }

    copy() {
        return new ValueExpression(this.nodeName, this.value);
    };

    isEqualTo(node: any) {
        if (node && this.nodeName === node.nodeName && this.value === node.value) {
            return true;
        }
        return false;
    };

    contains(node) {
        return this.isEqualTo(node);
    }

    static getExpressionType(value) {
        if (value instanceof Expression) {
            return value;
        }

        if (typeof value === "string") {
            return ValueExpression.string(value);
        } else if (typeof value === "function") {
            return ValueExpression.function(value);
        } else if (typeof value === "number") {
            return ValueExpression.number(value);
        } else if (typeof value === "boolean") {
            return ValueExpression.boolean(value);
        } else if (value === null) {
            return ValueExpression.null(value);
        } else if (typeof value === "undefined") {
            return ValueExpression.undefined(value);
        } else if (Array.isArray(value)) {
            return ValueExpression.array(value);
        } else if (value instanceof Date) {
            return ValueExpression.date(value);
        } else {
            return ValueExpression.object(value);
        }
    }

    static property(value) {
        return new ValueExpression("property", value);
    };

    static constant(value) {
        return new ValueExpression("constant", value);
    };

    static boolean(value) {
        var expression = new ValueExpression("boolean");
        expression.value = value;
        return expression;
    };

    static string(value) {
        var expression = new ValueExpression("string");
        expression.value = value;
        return expression;
    };

    static number(value) {
        var expression = new ValueExpression("number");
        expression.value = value;
        return expression;
    };

    static object(value) {
        var expression = new ValueExpression("object");
        expression.value = value;
        return expression;
    };

    static date(value) {
        var expression = new ValueExpression("date");
        expression.value = value;
        return expression;
    };

    static function(value) {
        var expression = new ValueExpression("function");
        expression.value = value;
        return expression;
    };

    static type(value) {
        var expression = new ValueExpression("type");
        expression.value = value || Object;
        return expression;
    };

    static null(value) {
        var expression = new ValueExpression("null");
        expression.value = value;
        return expression;
    };

    static undefined(value) {
        var expression = new ValueExpression("undefined");
        expression.value = value;
        return expression;
    };

    static array(value) {
        var expression = new ValueExpression("array");
        expression.value = value;
        return expression;
    };

    static queryable(leftExpression, rightExpression) {
        var expression = new OperationExpression("queryable");
        expression.children.push(leftExpression, rightExpression);
        return expression;
    };
}

export class OperationExpression extends Expression {
    children: Expression[];
    constructor(nodeName: string) {
        super(nodeName);
        this.children = [];
    }

    copy() {
        var children = [];
        var copy = new OperationExpression(this.nodeName);

        this.children.forEach(function (expression) {
            copy.children.push(expression.copy());
        });

        return copy;
    }

    isEqualTo(node) {
        if (!Array.isArray(node.children) || this.nodeName !== node.nodeName) {
            return false;
        }

        if (node.children.length !== this.children.length) {
            return false;
        }

        return this.children.every(function (expression, index) {
            return expression.isEqualTo(node.children[index]);
        });
    }

    contains(node) {
        if (node.nodeName === this.nodeName && Array.isArray(node.children)) {
            var matched = node.children.every((childNode, index) => {
                return childNode.contains(this.children[index]);
            });

            if (matched) {
                return true;
            }
        }

        return this.children.some(function (childNode) {
            return (<any>childNode).contains(node);
        });

    }

    getMatchingNodes(node, matchedNodes) {
        matchedNodes = Array.isArray(matchedNodes) ? matchedNodes : [];

        if (node.nodeName === this.nodeName && Array.isArray(node.children)) {
            var matched = node.children.every((childNode, index) => {
                return childNode.contains(this.children[index], matchedNodes);
            });

            if (matched) {
                matchedNodes.push(this);
            }
        }

        this.children.forEach((childNode: OperationExpression) => {
            if (Array.isArray(childNode.children)) {
                childNode.getMatchingNodes(node, matchedNodes);
            }
        }, matchedNodes);

        return matchedNodes;
    }

    static equalTo(left, right) {
        var expression = new OperationExpression("equalTo");
        Array.prototype.slice.call(arguments, 0).forEach(function (arg) {
            expression.children.push(arg);
        });
        return expression;
    };

    static notEqualTo(left, right) {
        var expression = new OperationExpression("notEqualTo");
        Array.prototype.slice.call(arguments, 0).forEach(function (arg) {
            expression.children.push(arg);
        });
        return expression;
    };

    static or(...args) {
        var expression = new OperationExpression("or");
        Array.prototype.slice.call(arguments, 0).forEach(function (arg) {
            expression.children.push(arg);
        });
        return expression;
    };

    static and(...args) {
        var expression = new OperationExpression("and");
        Array.prototype.slice.call(arguments, 0).forEach(function (arg) {
            expression.children.push(arg);
        });
        return expression;
    };

    static where(...args) {
        var expression = new OperationExpression("where");
        Array.prototype.slice.call(arguments, 0).forEach(function (arg) {
            expression.children.push(arg);
        });
        return expression;
    };

    static greaterThan(...args) {
        var expression = new OperationExpression("greaterThan");
        Array.prototype.slice.call(arguments, 0).forEach(function (arg) {
            expression.children.push(arg);
        });
        return expression;
    };

    static lessThan(...args) {
        var expression = new OperationExpression("lessThan");
        Array.prototype.slice.call(arguments, 0).forEach(function (arg) {
            expression.children.push(arg);
        });
        return expression;
    };

    static greaterThanOrEqualTo(...args) {
        var expression = new OperationExpression("greaterThanOrEqualTo");
        Array.prototype.slice.call(arguments, 0).forEach(function (arg) {
            expression.children.push(arg);
        });
        return expression;
    };

    static lessThanOrEqualTo(...args) {
        var expression = new OperationExpression("lessThanOrEqualTo");
        Array.prototype.slice.call(arguments, 0).forEach(function (arg) {
            expression.children.push(arg);
        });
        return expression;
    };

    static orderBy(...args) {
        var expression = new OperationExpression("orderBy");
        Array.prototype.slice.call(arguments, 0).forEach(function (arg) {
            expression.children.push(arg);
        });
        return expression;
    };

    static descending(...args) {
        var expression = new OperationExpression("descending");
        Array.prototype.slice.call(arguments, 0).forEach(function (arg) {
            expression.children.push(arg);
        });
        return expression;
    };

    static ascending(...args) {
        var expression = new OperationExpression("ascending");
        Array.prototype.slice.call(arguments, 0).forEach(function (arg) {
            expression.children.push(arg);
        });
        return expression;
    };

    static skip(value) {
        var expression = new OperationExpression("skip");
        var valueExpression = ValueExpression.constant(value);
        expression.children.push(valueExpression);

        return expression;
    };

    static take(value) {
        var expression = new OperationExpression("take");
        var valueExpression = ValueExpression.constant(value);
        expression.children.push(valueExpression);

        return expression;
    };

    static buildOperatorExpression(name) {
        var expression = new OperationExpression(name);
        var args = Array.prototype.slice.call(arguments, 1);
        args.forEach(function (arg) {
            expression.children.push(arg);
        });

        return expression;
    };

    static guid(...args) {
        var expression = new OperationExpression("guid");
        Array.prototype.slice.call(arguments, 0).forEach(function (arg) {
            expression.children.push(arg);
        });
        return expression;
    };

    static substring(...args) {
        var expression = new OperationExpression("substring");
        Array.prototype.slice.call(arguments, 0).forEach(function (arg) {
            expression.children.push(arg);
        });
        return expression;
    };

    static substringOf(...args) {
        var expression = new OperationExpression("substringOf");
        Array.prototype.slice.call(arguments, 0).forEach(function (arg) {
            expression.children.push(arg);
        });
        return expression;
    };

    static startsWith(...args) {
        var expression = new OperationExpression("startsWith");
        Array.prototype.slice.call(arguments, 0).forEach(function (arg) {
            expression.children.push(arg);
        });
        return expression;
    };

    static endsWith(...args) {
        var expression = new OperationExpression("endsWith");
        Array.prototype.slice.call(arguments, 0).forEach(function (arg) {
            expression.children.push(arg);
        });
        return expression;
    };

    static isIn(property, array) {
        var expression = new OperationExpression("isIn");
        Array.prototype.slice.call(arguments, 0).forEach(function (arg) {
            expression.children.push(arg);
        });
        return expression;
    };

    static isNotIn(property, array) {
        var expression = new OperationExpression("isNotIn");
        Array.prototype.slice.call(arguments, 0).forEach(function (arg) {
            expression.children.push(arg);
        });
        return expression;
    };

    static include(...args) {
        var expression = new OperationExpression("include");
        Array.prototype.slice.call(arguments, 0).forEach(function (arg) {
            expression.children.push(arg);
        });
        return expression;
    };

    static any(propertyAccessExpression, expression) {
        var anyExpression = new OperationExpression("any");
        var expressionExpression = OperationExpression.expression(expression);

        anyExpression.children.push(propertyAccessExpression, expressionExpression);
        return anyExpression;
    };

    static all(propertyAccessExpression, expression) {
        var allExpression = new OperationExpression("all");
        var expressionExpression = OperationExpression.expression(expression);

        allExpression.children.push(propertyAccessExpression, expressionExpression);
        return allExpression;
    };

    static expression(value) {
        var expresssionExpression = new ValueExpression("expression", value);

        return expresssionExpression;
    };

    static propertyAccess(leftExpression, propertyName) {
        var propertyExpression = ValueExpression.property(propertyName);
        var propertyAccessExpression = new OperationExpression("propertyAccess");
        propertyAccessExpression.children.push(leftExpression, propertyExpression);

        return propertyAccessExpression;
    };

    static contains(Type, namespace, expression) {
        var containsExpression = new OperationExpression("contains");
        var ofTypeExpression = new ValueExpression("ofType", Type);
        var propertyExpression = new ValueExpression("property", namespace);

        containsExpression.children.push(ofTypeExpression, propertyExpression, expression);

        return containsExpression;
    };

    static intersects(Type, namespace, expression) {
        var intersectsExpression = new OperationExpression("intersects");
        var ofTypeExpression = new ValueExpression("ofType", Type);
        var propertyExpression = new ValueExpression("property", namespace);

        intersectsExpression.children.push(ofTypeExpression, propertyExpression, expression);

        return intersectsExpression;
    };

}


