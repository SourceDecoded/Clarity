import Person = require("../Person");
import HumanoidType = require("../HumanoidType");
import EdmPackage = require("../../Edm");

export = {
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

