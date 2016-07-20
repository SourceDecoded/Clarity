import Person = require("../Person");
import HrAccount = require("../HrAccount");

export = {
    type: Person,
    hasKey: "id",
    hasOne: "hrAccount",
    ofType: HrAccount,
    withKey: "id",
    withForeignKey: "personId",
    withOne: "person"
};