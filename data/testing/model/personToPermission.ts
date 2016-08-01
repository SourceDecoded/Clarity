import PersonToPermission = require("../PersonToPermission");
import EdmPackage = require("../../Edm");

export = {
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

