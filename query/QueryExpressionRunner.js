"use strict";
var functionRegEx = /^(function)([ ]*?)(\(.*?\)[ ]*?\{.*?\})/;
var QueryExpressionRunner = (function () {
    function QueryExpressionRunner(esprima, visitor) {
        if (!esprima) {
            throw new Error("Illegal Argument Exception: esprima must be a object.");
        }
        if (!visitor) {
            throw new Error("Illegal Argument Exception: visitor must be a object.");
        }
        this.visitor = visitor;
        this.esprima = esprima;
    }
    QueryExpressionRunner.prototype.replaceLambdaString = function (match, part1, part2, part3) {
        return part1 + " where" + part3;
    };
    QueryExpressionRunner.prototype.createValidEsprimaLambdaString = function (lambdaFunction) {
        var lambdaString = lambdaFunction.toString();
        return lambdaString.replace(functionRegEx, this.replaceLambdaString);
    };
    QueryExpressionRunner.prototype.createAst = function (lambdaFunction) {
        var lambdaString = this.createValidEsprimaLambdaString(lambdaFunction);
        try {
            return this.esprima.parse(lambdaString);
        }
        catch (e) {
            throw new Error("Lambda Syntax Error: " + e.message);
        }
    };
    QueryExpressionRunner.prototype.run = function (lambdaFunction) {
        if (typeof lambdaFunction !== "function") {
            throw new Error("Illegal Argument Exception: lambdaFunction must be a function. ");
        }
        //Object.keys();
    };
    return QueryExpressionRunner;
}());
module.exports = QueryExpressionRunner;
//# sourceMappingURL=QueryExpressionRunner.js.map