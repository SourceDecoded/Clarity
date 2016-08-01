"use strict";
var Person = require("../Person");
var HumanoidType = require("../HumanoidType");
var EdmPackage = require("../../Edm");
module.exports = {
    type: Person,
    collectionName: "people",
    properties: {
        id: {
            type: EdmPackage.Integer,
            primaryKey: true,
            autoIncrement: true
        },
        firstName: {
            type: String
        },
        lastName: {
            type: String
        },
        age: {
            type: EdmPackage.Integer
        },
        placeOfBirth: {
            type: EdmPackage.Location
        },
        dateOfBirth: {
            type: EdmPackage.DateTimeOffset
        },
        humanoidType: {
            type: EdmPackage.Enum,
            genericTypeParameters: [HumanoidType]
        }
    }
};
//# sourceMappingURL=person.js.map