"use strict";
const Role = require("../Role");
const EdmPackage = require("../../Edm");
module.exports = {
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
//# sourceMappingURL=role.js.map