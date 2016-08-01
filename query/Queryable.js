"use strict";
const ExpressionPackage = require("./Expression");
const ExpressionBuilder = require("./ExpressionBuilder");
const clone = require("../util/clone");
var Expression = ExpressionPackage.Expression;
var OperationExpression = ExpressionPackage.OperationExpression;
var ValueExpression = ExpressionPackage.ValueExpression;
var assertHasProvider = function (queryable) {
    if (typeof queryable.provider === "undefined") {
        throw new Error("No provider found.");
    }
};
var copyQuery = function (query) {
    var copy = {};
    copy.where = query.where.copy();
    copy.orderBy = query.orderBy.copy();
    copy.include = query.include.copy();
    copy.parameters = clone(query.parameters);
    copy.take = query.take;
    copy.skip = query.skip;
    return copy;
};
class Queryable {
    constructor(Type, query) {
        this.skip = function (value) {
            if (typeof value !== "number") {
                throw new Error("Illegal Argument Exception: value needs to be a number.");
            }
            var query = copyQuery(this.getQuery());
            query.skip = OperationExpression.skip(value);
            return this.copy(query);
        };
        this.withParameters = function (params) {
            if (!params) {
                return;
            }
            var parameters = this.query.parameters = {};
            Object.keys(params).forEach(function (key) {
                parameters[key] = params[key];
            });
            return this;
        };
        this.toGuid = function (value) {
            return OperationExpression.guid(ValueExpression.constant(value));
        };
        this.toArrayAsync = function () {
            assertHasProvider(this);
            return this.provider.execute(this);
        };
        this.forEach = function (onEach) {
            this.toArray().then(function (results) {
                results.forEach(onEach);
            });
        };
        query = query || {};
        this.Type = Type || Object;
        this.provider = null;
        this.query = {};
        this.query.parameters = (query && query.parameters) || {};
        if (query.where != null && query.where.nodeName === "where") {
            this.query.where = query.where;
        }
        else {
            this.query.where = OperationExpression.where();
        }
        if (query.skip != null && query.skip.nodeName === "skip") {
            this.query.skip = query.skip;
        }
        else {
            this.query.skip = OperationExpression.skip(0);
        }
        if (query.take != null && query.take.nodeName === "take") {
            this.query.take = query.take;
        }
        else {
            this.query.take = OperationExpression.take(Infinity);
        }
        if (query.include != null && query.include.nodeName === "include") {
            this.query.include = query.include;
        }
        else {
            this.query.include = OperationExpression.include();
        }
        if (query.orderBy != null && query.orderBy.nodeName === "orderBy") {
            this.query.orderBy = query.orderBy;
        }
        else {
            this.query.orderBy = OperationExpression.orderBy();
        }
    }
    assertHasProvider() {
        if (typeof this.provider === "undefined") {
            throw new Error("No provider found.");
        }
    }
    getExpression() {
        return this.query;
    }
    ;
    getQuery() {
        return this.query;
    }
    or(lambda) {
        var rightExpression;
        var query = copyQuery(this.getQuery());
        if (typeof lambda === "function") {
            lambda = lambda || function () { };
            rightExpression = lambda.call(ExpressionBuilder, new ExpressionBuilder(this.Type));
        }
        else if (lambda instanceof Expression) {
            rightExpression = lambda;
        }
        else {
            return;
        }
        if (query.where.children.length === 0) {
            query.where.children.push(rightExpression);
        }
        else {
            var leftExpression = query.where.children.pop();
            query.where.children.push(OperationExpression.or(leftExpression, rightExpression));
        }
        return this.copy(query);
    }
    ;
    where(lambda) {
        var rightExpression;
        var query = copyQuery(this.getQuery());
        if (typeof lambda === "function") {
            lambda = lambda || function () { };
            rightExpression = lambda.call(ExpressionBuilder, new ExpressionBuilder(this.Type));
        }
        else if (lambda instanceof Expression) {
            rightExpression = lambda;
        }
        else {
            return;
        }
        if (query.where.children.length === 0) {
            query.where.children.push(rightExpression);
        }
        else {
            var leftExpression = query.where.children.pop();
            query.where.children.push(OperationExpression.and(leftExpression, rightExpression));
        }
        return this.copy(query);
    }
    ;
    and() {
        return this.where.apply(this, arguments);
    }
    take(value) {
        if (typeof value !== "number") {
            throw new Error("Illegal Argument Exception: value needs to be a number.");
        }
        var query = copyQuery(this.getQuery());
        query.take = OperationExpression.take(value);
        return this.copy(query);
    }
    ;
    orderByDesc(lambda) {
        var query = copyQuery(this.getQuery());
        var descendingExpression = OperationExpression.descending(lambda.call(ExpressionBuilder, new ExpressionBuilder(this.Type)).getExpression());
        query.orderBy.children.push(descendingExpression);
        return this.copy(query);
    }
    ;
    orderBy(lambda) {
        var query = copyQuery(this.getQuery());
        var ascendingExpression = OperationExpression.ascending(lambda.call(ExpressionBuilder, new ExpressionBuilder(this.Type)).getExpression());
        query.orderBy.children.push(ascendingExpression);
        return this.copy(query);
    }
    ;
    setParameters(params) {
        if (!params) {
            return;
        }
        var parameters = this.query.parameters;
        Object.keys(params).forEach(function (key) {
            parameters[key] = params[key];
        });
        return this;
    }
    ;
    toArray(callback) {
        assertHasProvider(this);
        var future = this.provider.execute(this);
        if (typeof callback === "function") {
            future.then(callback);
        }
        return future;
    }
    ;
    count() {
        assertHasProvider(this);
        return this.provider.count(this);
    }
    ;
    toArrayWithCount() {
        assertHasProvider(this);
        return this.provider.toArrayWithCount(this);
    }
    ;
    all(lambda) {
        assertHasProvider(this);
        return this.provider.all(this, lambda);
    }
    ;
    any(lambda) {
        assertHasProvider(this);
        return this.provider.any(this, lambda);
    }
    ;
    firstOrDefault(lambda) {
        assertHasProvider(this);
        return this.provider.firstOrDefault(this, lambda);
    }
    ;
    lastOrDefault(lambda) {
        console.log("Deprecated. Use orderBy and firstOrDefault");
        assertHasProvider(this);
        return this.provider.lastOrDefault(this, lambda);
    }
    ;
    first(lambda) {
        assertHasProvider(this);
        return this.provider.first(this, lambda);
    }
    ;
    last(lambda) {
        assertHasProvider(this);
        return this.provider.last(this, lambda);
    }
    ;
    select(lambda) {
        assertHasProvider(this);
        return this.provider.select(this, lambda);
    }
    ;
    contains(lambda) {
        assertHasProvider(this);
        return this.provider.contains(this, lambda);
    }
    ;
    include(lambda) {
        var query = copyQuery(this.getQuery());
        var operationExpressionBuilder = lambda.call(ExpressionBuilder, new ExpressionBuilder(this.Type));
        if (typeof operationExpressionBuilder.getExpression !== "function") {
            throw new Error("Expected a property to include.");
        }
        var queryableExpression = operationExpressionBuilder.getExpression();
        if (queryableExpression.nodeName !== "queryable") {
            queryableExpression = ValueExpression.queryable(queryableExpression, OperationExpression.expression(OperationExpression.where()));
        }
        query.include.children.push(queryableExpression);
        return this.copy(query);
    }
    ;
    ifNone(callback) {
        this.count().then(function (count) {
            if (count === 0) {
                callback();
            }
        });
        return this;
    }
    ;
    ifAny(callback) {
        this.toArray(function (a) {
            if (a.length > 0) {
                callback(a);
            }
        });
        return this;
    }
    ;
    intersects(compareToQueryable) {
        assertHasProvider(this);
        if (compareToQueryable instanceof Array) {
            compareToQueryable = compareToQueryable.asQueryable();
        }
        return this.provider.intersects(this, compareToQueryable);
    }
    ;
    ofType(Type) {
        var queryable = new Queryable(Type);
        queryable.provider = this.provider;
        return queryable;
    }
    ;
    createCopy(expression) {
        var queryable = new Queryable(this.Type, expression);
        queryable.provider = this.provider;
        return queryable;
    }
    ;
    copyExpressionObject(expressionObject) {
        var expression = {};
        Object.keys(expressionObject).forEach(function (key) {
            var value = expressionObject[key];
            if (key === "parameters") {
                expression[key] = clone(value);
            }
            else {
                if (value) {
                    expression[key] = value.copy();
                }
                else {
                    expression[key] = null;
                }
            }
        });
        return expression;
    }
    ;
    copy(query) {
        var queryable = new Queryable(this.Type, query || copyQuery(this.query));
        queryable.provider = this.provider;
        return queryable;
    }
    ;
    merge(queryable) {
        var clone = this.copy();
        var cloneQuery = clone.getQuery();
        var query = queryable.getQuery();
        var rightExpression = query.where.children[0];
        if (rightExpression != null) {
            // No need to copy if there is nothing to copy.
            if (cloneQuery.where.children.length === 0) {
                cloneQuery.where.children.push(rightExpression.copy());
            }
            else if (cloneQuery.where.children.length === 1 && cloneQuery.where.children[0].nodeName === "and") {
                cloneQuery.where.children[0].children.push(rightExpression.copy());
            }
            else {
                var leftExpression = cloneQuery.where.children.pop();
                cloneQuery.where.children.push(OperationExpression.and(leftExpression, rightExpression.copy()));
            }
        }
        query.include.children.forEach(function (expression) {
            cloneQuery.include.children.push(expression.copy());
        });
        query.orderBy.children.forEach(function (expression) {
            cloneQuery.orderBy.children.push(expression.copy());
        });
        return this.copy(cloneQuery);
    }
    ;
}
module.exports = Queryable;
//# sourceMappingURL=Queryable.js.map