"use strict";
var Address = require("../Address");
var EdmPackage = require("../../Edm");
module.exports = {
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
//# sourceMappingURL=address.js.map