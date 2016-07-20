import Person = require("../Person");
import Address = require("../Address");

export = {
    type: Person,
    hasKey: "id",
    hasMany: "addresses",
    ofType: Address,
    withKey: "id",
    withForeignKey: "personId",
    withOne: "person"
};

