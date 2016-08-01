"use strict";
const PhoneNumber = require("../PhoneNumber");
const PhoneNumberType = require("../PhoneNumberType");
const EdmPackage = require("../../Edm");
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