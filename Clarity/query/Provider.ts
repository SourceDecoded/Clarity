import Future = require("../async/Future");
import ExpressionBuilder = require("./ExpressionBuilder");
import ExpressionPackage = require("./Expression");
import Queryable = require("./Queryable");

var Expression = ExpressionPackage.Expression;
var OperationExpression = ExpressionPackage.OperationExpression;
var ValueExpression = ExpressionPackage.ValueExpression;

class Provider {

    count(queryable) {
        var oldExpression = queryable.getExpression();
        var expression = <any>{};

        expression.where = oldExpression.where;

        var newQueryable = new Queryable(queryable.Type, expression);

        return this.toArray(newQueryable).chain(function (array) {
            return array.length;
        });
    };

    any(queryable, func) {
        if (typeof func === "function") {
            queryable = queryable.where(func);
        }

        return queryable.take(1).toArray().chain(function (results) {
            if (results.length > 0) {
                return true;
            } else {
                return false;
            }
        });

    };

    all(queryable, func) {
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

    firstOrDefault(queryable, func) {
        if (typeof func === "function") {
            queryable = queryable.where(func);
        }

        return queryable.take(1).toArray().chain(function (results) {
            return results[0] || null;
        });
    };

    first(queryable, func) {
        if (typeof func === "function") {
            queryable = queryable.where(func);
        }

        return queryable.take(1).toArray().chain(function (results) {
            var result = results[0];

            if (typeof result === "undefined") {
                return result;
            } else {
                return Future.fromError(new Error("There wasn't a match."));
            }

        });
    };

    contains(queryable, func): Future<boolean> {
        if (typeof func === "function") {
            queryable = queryable.where(func);
        }

        return queryable.take(1).toArray().chain(function (results) {
            return results > 0;
        });
    };

    select(queryable, forEachFunc) {
        return this.toArray(queryable).chain(function (array) {
            return array.map(forEachFunc);
        });
    };

    intersects(queryable, compareToQueryable): Future<boolean> {
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

    toArrayWithCount(queryable): Future<{ count: number, array: any[] }> {
        var count;

        return this.count(queryable).chain((c) => {
            count = c;
        }).chain(() => {
            return this.toArray(queryable);
        }).chain((array) => {
            return {
                count: count,
                array: array
            };
        });
    };

    toArray(queryable): Future<any[]> {
        throw new Error("Provider hasn't implemented toArray and execute.");
    };
            
    //This should always return a Future of an array of objects.
    execute(queryable): Future<any[]> {
        return this.toArray(queryable);
    }
}

export = Provider;