"use strict";
var PhoneNumber = require("../PhoneNumber");
var PhoneNumberType = require("../PhoneNumberType");
var EdmPackage = require("../../Edm");
module.exports = {
    type: PhoneNumber,
    collectionName: "phoneNumbers",
    properties: {
        id: {
            type: EdmPackage.Integer,
            primaryKey: true,
            autoIncrement: true
        },
        areacode: {
            type: EdmPackage.Integer
        },
        lineNumber: {
            type: EdmPackage.Integer
        },
        personId: {
            type: EdmPackage.Integer
        },
        type: {
            type: EdmPackage.Enum,
            genericTypeParameters: [PhoneNumberType]
        }
    }
};
//# sourceMappingURL=phoneNumber.js.map