"use strict";
var functionRegEx = /^(function)([ ]*?)(\(.*?\)[ ]*?\{.*?\})/;
class QueryExpressionRunner {
    constructor(esprima, visitor) {
        if (!esprima) {
            throw new Error("Illegal Argument Exception: esprima must be a object.");
        }
        if (!visitor) {
            throw new Error("Illegal Argument Exception: visitor must be a object.");
        }
        this.visitor = visitor;
        this.esprima = esprima;
    }
    replaceLambdaString(match, part1, part2, part3) {
        return part1 + " where" + part3;
    }
    createValidEsprimaLambdaString(lambdaFunction) {
        var lambdaString = lambdaFunction.toString();
        return lambdaString.replace(functionRegEx, this.replaceLambdaString);
    }
    createAst(lambdaFunction) {
        var lambdaString = this.createValidEsprimaLambdaString(lambdaFunction);
        try {
            return this.esprima.parse(lambdaString);
        }
        catch (e) {
            throw new Error("Lambda Syntax Error: " + e.message);
        }
    }
    run(lambdaFunction) {
        if (typeof lambdaFunction !== "function") {
            throw new Error("Illegal Argument Exception: lambdaFunction must be a function. ");
        }
        //Object.keys();
    }
}
module.exports = QueryExpressionRunner;
//# sourceMappingURL=QueryExpressionRunner.js.map