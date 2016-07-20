"use strict";
var Future = require("../async/Future");
var ExpressionPackage = require("./Expression");
var Queryable = require("./Queryable");
var Expression = ExpressionPackage.Expression;
var OperationExpression = ExpressionPackage.OperationExpression;
var ValueExpression = ExpressionPackage.ValueExpression;
var Provider = (function () {
    function Provider() {
    }
    Provider.prototype.count = function (queryable) {
        var oldExpression = queryable.getExpression();
        var expression = {};
        expression.where = oldExpression.where;
        var newQueryable = new Queryable(queryable.Type, expression);
        return this.toArray(newQueryable).chain(function (array) {
            return array.length;
        });
    };
    ;
    Provider.prototype.any = function (queryable, func) {
        if (typeof func === "function") {
            queryable = queryable.where(func);
        }
        return queryable.take(1).toArray().chain(function (results) {
            if (results.length > 0) {
                return true;
            }
            else {
                return false;
            }
        });
    };
    ;
    Provider.prototype.all = function (queryable, func) {
        if (typeof func === "undefined") {
            return Future.fromResult(true);
        }
        if (typeof func !== "function") {
            throw new Error("The reduce expression needs to be a function.");
        }
        return queryable.count().chain(function (length) {
            return queryable.where(func).toArray().chain(function (results) {
                return results.length = length;
            });
        });
    };
    ;
    Provider.prototype.firstOrDefault = function (queryable, func) {
        if (typeof func === "function") {
            queryable = queryable.where(func);
        }
        return queryable.take(1).toArray().chain(function (results) {
            return results[0] || null;
        });
    };
    ;
    Provider.prototype.first = function (queryable, func) {
        if (typeof func === "function") {
            queryable = queryable.where(func);
        }
        return queryable.take(1).toArray().chain(function (results) {
            var result = results[0];
            if (typeof result === "undefined") {
                return result;
            }
            else {
                return Future.fromError(new Error("There wasn't a match."));
            }
        });
    };
    ;
    Provider.prototype.contains = function (queryable, func) {
        if (typeof func === "function") {
            queryable = queryable.where(func);
        }
        return queryable.take(1).toArray().chain(function (results) {
            return results > 0;
        });
    };
    ;
    Provider.prototype.select = function (queryable, forEachFunc) {
        return this.toArray(queryable).chain(function (array) {
            return array.map(forEachFunc);
        });
    };
    ;
    Provider.prototype.intersects = function (queryable, compareToQueryable) {
        return Future.all([this.toArray(queryable), compareToQueryable.toArray()]).chain(function (results) {
            var intersects = [];
            var array1 = results[0].value;
            var array2 = results[1].value;
            array1.forEach(function (item) {
                if (array2.indexOf(item) > -1) {
                    intersects.push(item);
                }
            });
            return intersects;
        });
    };
    ;
    Provider.prototype.toArrayWithCount = function (queryable) {
        var _this = this;
        var count;
        return this.count(queryable).chain(function (c) {
            count = c;
        }).chain(function () {
            return _this.toArray(queryable);
        }).chain(function (array) {
            return {
                count: count,
                array: array
            };
        });
    };
    ;
    Provider.prototype.toArray = function (queryable) {
        throw new Error("Provider hasn't implemented toArray and execute.");
    };
    ;
    //This should always return a Future of an array of objects.
    Provider.prototype.execute = function (queryable) {
        return this.toArray(queryable);
    };
    return Provider;
}());
module.exports = Provider;
//# sourceMappingURL=Provider.js.map