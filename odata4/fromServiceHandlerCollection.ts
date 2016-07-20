import Hashmap = require("../collections/Hashmap");
import EdmPackage = require("../data/Edm");

var handlers = new Hashmap();

var dateHandler = function (dateString) {
    if (typeof dateString === "string") {
        return new Date(dateString);
    } else {
        return null;
    }
};

var locationHandler = function (value) {

    if (value !== null) {
        var location = new EdmPackage.Location();
        location.longitude = value.longitude;
        location.latitude = value.latitude;
    } else {
        location = value;
    }

    return location;
};

handlers.add(Date, dateHandler);
handlers.add(EdmPackage.DateTimeOffset, dateHandler);
handlers.add(EdmPackage.Location, locationHandler);

export = handlers;
