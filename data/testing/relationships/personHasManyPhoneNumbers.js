"use strict";
var Person = require("../Person");
var PhoneNumber = require("../PhoneNumber");
module.exports = {
    type: Person,
    hasKey: "id",
    hasMany: "phoneNumbers",
    ofType: PhoneNumber,
    withKey: "id",
    withForeignKey: "personId",
    withOne: "person"
};
//# sourceMappingURL=personHasManyPhoneNumbers.js.map