"use strict";
var Hashmap = require("../collections/Hashmap");
var EdmPackage = require("../data/Edm");
var handlers = new Hashmap();
var locationHandler = function (location) {
    return location;
};
handlers.add(EdmPackage.Location, locationHandler);
module.exports = handlers;
//# sourceMappingURL=toServiceHandlerCollection.js.map