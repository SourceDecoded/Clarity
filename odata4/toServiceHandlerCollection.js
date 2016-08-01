"use strict";
const Hashmap = require("../collections/Hashmap");
const EdmPackage = require("../data/Edm");
var handlers = new Hashmap();
var locationHandler = function (location) {
    return location;
};
handlers.add(EdmPackage.Location, locationHandler);
module.exports = handlers;
//# sourceMappingURL=toServiceHandlerCollection.js.map