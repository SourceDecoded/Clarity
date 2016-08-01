"use strict";
const ArrayVisitor = require("./ArrayVisitor");
const Future = require("../async/Future");
const Provider = require("./Provider");
class ArrayProvider extends Provider {
    constructor(array = []) {
        super();
        this.array = array;
    }
    toArray(queryable) {
        return new Future((setValue, setError) => {
            var visitor = new ArrayVisitor();
            var query = queryable.getQuery();
            var filter = null;
            var sort = null;
            var skip = query.skip.children[0].value;
            var take = query.take.children[0].value;
            var results = null;
            filter = visitor.parse(query.where);
            sort = visitor.parse(query.orderBy);
            results = this.array.filter(filter);
            results = results.sort(sort);
            if (take === Infinity) {
                take = undefined;
            }
            else {
                take = skip + take;
            }
            results = results.slice(skip, take);
            setTimeout(function () {
                setValue(results);
            }, 0);
        });
    }
    ;
    execute(queryable) {
        return this.toArray(queryable);
    }
}
module.exports = ArrayProvider;
//# sourceMappingURL=ArrayProvider.js.map