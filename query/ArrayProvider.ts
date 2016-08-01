import ArrayVisitor = require("./ArrayVisitor");
import Future = require("../async/Future");
import Provider = require("./Provider");

class ArrayProvider extends Provider {
    array: any[];

    constructor(array = []) {
        super();
        this.array = array
    }

    toArray(queryable): Future<any[]> {
        return new Future<any[]>((setValue, setError) => {
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
            } else {
                take = skip + take;
            }

            results = results.slice(skip, take);

            setTimeout(function () {
                setValue(results);
            }, 0);
        });
    };

    execute(queryable): Future<any[]> {
        return this.toArray(queryable);
    }
}

export = ArrayProvider;