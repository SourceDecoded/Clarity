import Permission = require("../Permission");
import EdmPackage = require("../../Edm");

export = {
    type: Permission,
    collectionName: "permissions",
    properties: {
        id: {
            type: EdmPackage.Integer,
            primaryKey: true,
            autoIncrement: true
        },
        name: {
            type: String
        }
    }
};

