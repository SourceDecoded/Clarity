import toCamelCase = require("../string/toCamelCase");
var functionRegEx = /^(function)([ ]*?)(\(.*?\)[ ]*?\{.*?\})/;

class QueryExpressionRunner {
    private visitor;
    private esprima;

    private replaceLambdaString(match, part1, part2, part3) {
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
        } catch (e) {
            throw new Error("Lambda Syntax Error: " + e.message);
        }
    }

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

    run(lambdaFunction) {
        if (typeof lambdaFunction !== "function") {
            throw new Error("Illegal Argument Exception: lambdaFunction must be a function. ");
        }

        //Object.keys();

    }
}
export = QueryExpressionRunner;

