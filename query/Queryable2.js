"use strict";
//import ExpressionPackage = require("./Expression");
//import clone = require("../util/clone");
//var Expression = ExpressionPackage.Expression;
//var OperationExpression = ExpressionPackage.OperationExpression;
//var ValueExpression = ExpressionPackage.ValueExpression;
//class Queryable {
//    Type: any;
//    private expression: any;
//    private parameters: any;
//    private assertHasProvider() {
//        if (typeof this.provider === "undefined") {
//            throw new Error("No provider found.");
//        }
//    }
//    whereExpression: any;
//    takeExpression: any;
//    skipExpression: any;
//    orderByExpression: any;
//    includeExpression: any;
//    provider: any;
//    constructor(Type?, expression?) {
//        this.expression = expression || {};
//        this.parameters = expression.parameters || {};
//        this.Type = Type || Object;
//        this.provider = null;
//        this.whereExpression = expression.where || null;
//        this.takeExpression = expression.take || null;
//        this.includeExpression = expression.include || new OperationExpression("include");
//        this.orderByExpression = expression.orderBy ? expression.orderBy.children : [];
//    }
//    getExpression() {
//        return {
//            where: this.whereExpression,
//            take: this.takeExpression,
//            skip: this.skipExpression,
//            orderBy: this.orderByExpression.length === 0 ? null : OperationExpression.orderBy.apply(OperationExpression, this.orderByExpression),
//            parameters: this.parameters,
//            include: this.includeExpression
//        };
//    };
//    or(fn) {
//        var rightExpression;
//        if (fn instanceof Expression) {
//            rightExpression = OperationExpression.and.apply(Expression, arguments);
//        } else {
//            fn = fn || function () { };
//            rightExpression = fn.call(ExpressionBuilder, new ExpressionBuilder(this.Type));
//        }
//        var expression = <any>this.copyExpressionObject(this.getExpression());
//        if (expression.where) {
//            var expressions = expression.where.children;
//            expressions.push(rightExpression);
//            expression.where = OperationExpression.where(OperationExpression.or.apply(Expression, expressions));
//        } else {
//            expression.where = OperationExpression.where(rightExpression);
//        }
//        var copy = this.createCopy(expression);
//        return copy;
//    };
//    where(fn) {
//        var rightExpression;
//        if (fn instanceof Expression) {
//            rightExpression = OperationExpression.and.apply(OperationExpression, arguments);
//        } else {
//            fn = fn || function () { };
//            rightExpression = fn.call(ExpressionBuilder, new ExpressionBuilder(this.Type));
//            if (typeof rightExpression === "undefined") {
//                throw new Error("Invalid expression: return the expression.");
//            }
//        }
//        var expression = <any>this.copyExpressionObject(this.getExpression());
//        if (expression.where) {
//            var expressions = expression.where.children;
//            expressions.push(rightExpression);
//            expression.where = OperationExpression.where(OperationExpression.and.apply(OperationExpression, expressions));
//        } else {
//            expression.where = OperationExpression.where(rightExpression);
//        }
//        var copy = this.createCopy(expression);
//        return copy;
//    };
//    and() {
//        return this.where.apply(this, arguments);
//    }
//    take(value) {
//        var expression = <any>this.copyExpressionObject(this.getExpression());
//        expression.take = OperationExpression.take(value);
//        var copy = this.createCopy(expression);
//        return copy;
//    };
//    skip = function (value) {
//        var expression = <any>this.copyExpressionObject(this.getExpression());
//        expression.skip = OperationExpression.skip(ValueExpression.constant(value));
//        var copy = this.createCopy(expression);
//        return copy;
//    };
//    orderByDesc(fn) {
//        var expression = <any>this.copyExpressionObject(this.getExpression());
//        var orderBy = { children: [] };
//        this.orderByExpression.forEach(function (expression) {
//            orderBy.children.push(expression.copy());
//        });
//        var exp = fn.call(self, new ExpressionBuilder(this.Type));
//        orderBy.children.push(OperationExpression.descending(exp.getExpression()));
//        expression.orderBy = orderBy;
//        var copy = this.createCopy(expression);
//        return copy;
//    };
//    orderBy(fn) {
//        var expression = <any>this.copyExpressionObject(this.getExpression());
//        var orderBy = { children: [] };
//        this.orderByExpression.forEach(function (expression) {
//            orderBy.children.push(expression.copy());
//        });
//        var exp = fn.call(self, new ExpressionBuilder(this.Type));
//        orderBy.children.push(OperationExpression.ascending(exp.getExpression()));
//        expression.orderBy = orderBy;
//        var copy = this.createCopy(expression);
//        return copy;
//    };
//    setParameters(params) {
//        if (!params) {
//            return;
//        }
//        Object.keys(params).forEach(function (key) {
//            this.parameters[key] = params[key];
//        });
//        return self;
//    };
//    withParameters = function (params) {
//        this.parameters = {};
//        Object.keys(params).forEach(function (key) {
//            this.parameters[key] = params[key];
//        });
//        return self;
//    };
//    toGuid = function (value) {
//        return OperationExpression.guid(ValueExpression.constant(value));
//    };
//    toArray(callback?) {
//        this.assertHasProvider();
//        var future = this.provider.execute(this);
//        if (typeof callback === "function") {
//            future.then(callback);
//        }
//        return future;
//    };
//    toArrayAsync = function () {
//        this.assertHasProvider();
//        return this.provider.execute(this);
//    };
//    forEach = function (onEach) {
//        this.toArray(function (results) {
//            results.forEach(onEach);
//        });
//    };
//    count() {
//        this.assertHasProvider();
//        return this.provider.count(self);
//    };
//    toArrayWithCount() {
//        this.assertHasProvider();
//        return this.provider.toArrayWithCount(self);
//    };
//    all(func?) {
//        this.assertHasProvider();
//        return this.provider.all(this, func);
//    };
//    any(func?) {
//        this.assertHasProvider();
//        return this.provider.any(self, func);
//    };
//    firstOrDefault(func?) {
//        this.assertHasProvider();
//        return this.provider.firstOrDefault(self, func);
//    };
//    lastOrDefault(func?) {
//        this.assertHasProvider();
//        return this.provider.lastOrDefault(self, func);
//    };
//    first(func?) {
//        this.assertHasProvider();
//        return this.provider.first(self, func);
//    };
//    last(func?) {
//        this.assertHasProvider();
//        return this.provider.last(self, func);
//    };
//    select(func?) {
//        this.assertHasProvider();
//        return this.provider.select(self, func);
//    };
//    contains(func?) {
//        this.assertHasProvider();
//        return this.provider.contains(self, func);
//    };
//    include(func) {
//        var expression = <any>this.copyExpressionObject(this.getExpression());
//        var copy;
//        var operationExpressionBuilder = func.call(ExpressionBuilder, new ExpressionBuilder(this.Type));
//        if (typeof operationExpressionBuilder.getExpression !== "function") {
//            throw new Error("Expected a property to include.");
//        }
//        var queryableExpression = operationExpressionBuilder.getExpression();
//        if (queryableExpression.nodeName !== "queryable") {
//            queryableExpression = ValueExpression.queryable(queryableExpression, OperationExpression.expression(OperationExpression.where()));
//        }
//        expression.include.children.push(queryableExpression);
//        copy = this.createCopy(expression);
//        return copy;
//    };
//    ifNone(callback) {
//        this.count().then(function (count) {
//            if (count === 0) {
//                callback();
//            }
//        });
//        return this;
//    };
//    ifAny(callback) {
//        this.toArray(function (a) {
//            if (a.length > 0) {
//                callback(a);
//            }
//        });
//        return this;
//    };
//    intersects(compareToQueryable) {
//        this.assertHasProvider();
//        if (compareToQueryable instanceof Array) {
//            compareToQueryable = compareToQueryable.asQueryable();
//        }
//        return this.provider.intersects(this, compareToQueryable);
//    };
//    ofType(Type) {
//        var queryable = new Queryable(this.Type);
//        queryable.provider = this.provider;
//        return queryable;
//    };
//    createCopy(expression) {
//        var queryable = new Queryable(this.Type, expression);
//        queryable.provider = this.provider;
//        return queryable;
//    };
//    copyExpressionObject(expressionObject) {
//        var expression = {};
//        Object.keys(expressionObject).forEach(function (key) {
//            var value = expressionObject[key];
//            if (key === "parameters") {
//                expression[key] = clone(value);
//            } else {
//                if (value) {
//                    expression[key] = value.copy();
//                } else {
//                    expression[key] = null;
//                }
//            }
//        });
//        return expression;
//    };
//    copy() {
//        var queryable = this.createCopy(this.copyExpressionObject(this.getExpression()));
//        return queryable.withParameters(this.parameters);
//    };
//    merge(queryable) {
//        var clone = <any>this.copy();
//        var rightExpression = queryable.getExpression();
//        if (rightExpression) {
//            var expression = clone.getExpression();
//            // Override the current value with the queryable or default back to the original value.
//            clone.skipExpression = rightExpression.skip || expression.skip;
//            clone.takeExpression = rightExpression.take || expression.take;
//            clone.orderByExpression = [];
//            clone.includeExpression = rightExpression.include.copy();
//            if (rightExpression.orderBy) {
//                clone.orderByExpression = rightExpression.orderBy.children;
//            }
//            if (clone.whereExpression) {
//                if (rightExpression.where !== null) {
//                    var expressions = expression.where.children;
//                    expressions.push.apply(expressions, rightExpression.where.children);
//                    clone.whereExpression = OperationExpression.where(OperationExpression.and.apply(OperationExpression, expressions));
//                }
//            } else {
//                if (rightExpression.where !== null) {
//                    clone.whereExpression = rightExpression.where;
//                }
//            }
//        }
//        return clone;
//    };
//}
//export = Queryable;
//# sourceMappingURL=Queryable2.js.map