import Hashmap = require("../collections/Hashmap");
import EdmPackage = require("../data/Edm");

var handlers = new Hashmap();

var locationHandler = function (location) {
    return location;
};

handlers.add(EdmPackage.Location, locationHandler);

export = handlers;

