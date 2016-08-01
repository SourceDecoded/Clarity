"use strict";
const ArrayProvider = require("../query/ArrayProvider");
const Queryable = require("../query/Queryable");
var _asQueryable = function (Type) {
    var self = this;
    Type = Type || self.Type;
    var queryable = new Queryable(Type || Object);
    queryable.provider = self.getProvider();
    return queryable;
};
var _providerFactory = function () {
    var self = this;
    return new ArrayProvider(self);
};
Array.prototype.getProvider = _providerFactory;
Array.prototype.asQueryable = _asQueryable;
//# sourceMappingURL=asQueryable.js.map