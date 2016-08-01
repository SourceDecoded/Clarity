"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var ArrayVisitor = require("./ArrayVisitor");
var Future = require("../async/Future");
var Provider = require("./Provider");
var ArrayProvider = (function (_super) {
    __extends(ArrayProvider, _super);
    function ArrayProvider(array) {
        if (array === void 0) { array = []; }
        _super.call(this);
        this.array = array;
    }
    ArrayProvider.prototype.toArray = function (queryable) {
        var _this = this;
        return new Future(function (setValue, setError) {
            var visitor = new ArrayVisitor();
            var query = queryable.getQuery();
            var filter = null;
            var sort = null;
            var skip = query.skip.children[0].value;
            var take = query.take.children[0].value;
            var results = null;
            filter = visitor.parse(query.where);
            sort = visitor.parse(query.orderBy);
            results = _this.array.filter(filter);
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
    };
    ;
    ArrayProvider.prototype.execute = function (queryable) {
        return this.toArray(queryable);
    };
    return ArrayProvider;
}(Provider));
module.exports = ArrayProvider;
//# sourceMappingURL=ArrayProvider.js.map