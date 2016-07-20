import ArrayProvider = require("../query/ArrayProvider");
import Queryable = require("../query/Queryable");

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

(<any>Array.prototype).getProvider = _providerFactory;
(<any>Array.prototype).asQueryable = _asQueryable;
