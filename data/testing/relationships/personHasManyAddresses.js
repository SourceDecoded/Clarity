"use strict";
const Person = require("../Person");
const Address = require("../Address");
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