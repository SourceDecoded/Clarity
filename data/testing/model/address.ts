import Address = require("../Address");
import EdmPackage = require("../../Edm");

export = {
    type: Address,
    collectionName: "addresses",
    properties: {
        id: {
            type: EdmPackage.Integer,
            primaryKey: true,
            autoIncrement: true
        },
        street: {
            type: String
        },
        city: {
            type: String
        },
        zip: {
            type: String
        },
        country: {
            type: String
        },
        personId: {
            type: EdmPackage.Integer
        }
    }
};
