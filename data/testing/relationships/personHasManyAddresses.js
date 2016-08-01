"use strict";
var Person = require("../Person");
var Address = require("../Address");
module.exports = {
    type: Person,
    hasKey: "id",
    hasMany: "addresses",
    ofType: Address,
    withKey: "id",
    withForeignKey: "personId",
    withOne: "person"
};
//# sourceMappingURL=personHasManyAddresses.js.map