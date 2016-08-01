"use strict";
const PersonToPermission = require("../PersonToPermission");
const EdmPackage = require("../../Edm");
module.exports = {
    type: PersonToPermission,
    properties: {
        personId: {
            type: EdmPackage.Integer,
            primaryKey: true
        },
        permissionId: {
            type: EdmPackage.Integer,
            primaryKey: true
        }
    }
};
//# sourceMappingURL=personToPermission.js.map