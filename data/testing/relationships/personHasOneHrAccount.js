"use strict";
const Person = require("../Person");
const HrAccount = require("../HrAccount");
module.exports = {
    type: Person,
    hasKey: "id",
    hasOne: "hrAccount",
    ofType: HrAccount,
    withKey: "id",
    withForeignKey: "personId",
    withOne: "person"
};
//# sourceMappingURL=personHasOneHrAccount.js.map