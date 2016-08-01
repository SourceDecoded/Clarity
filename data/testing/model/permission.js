"use strict";
const Permission = require("../Permission");
const EdmPackage = require("../../Edm");
module.exports = {
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
//# sourceMappingURL=permission.js.map