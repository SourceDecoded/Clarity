import Role = require("../Role");
import EdmPackage = require("../../Edm");

export = {
    type: Role,
    collectionName: "roles",
    properties: {
        id: {
            type: EdmPackage.Integer,
            primaryKey: true,
            autoIncrement: true
        },
        personId: {
            type: EdmPackage.Integer
        },
        name: {
            type: String
        }
    }
};

