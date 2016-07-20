import Person = require("../Person");
import PhoneNumber = require("../PhoneNumber");

export = {
    type: Person,
    hasKey: "id",
    hasMany: "phoneNumbers",
    ofType: PhoneNumber,
    withKey: "id",
    withForeignKey: "personId",
    withOne: "person"
};

