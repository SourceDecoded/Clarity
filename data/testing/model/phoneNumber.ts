import PhoneNumber = require("../PhoneNumber");
import PhoneNumberType = require("../PhoneNumberType");
import EdmPackage = require("../../Edm");

export = {
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

