"use strict";
var HrAccount = require("../HrAccount");
var EdmPackage = require("../../Edm");
module.exports = {
    type: HrAccount,
    collectionName: "hrAccounts",
    properties: {
        id: {
            type: EdmPackage.Integer,
            primaryKey: true,
            autoIncrement: true
        },
        accountId: {
            type: EdmPackage.Integer
        },
        personId: {
            type: EdmPackage.Integer
        }
    }
};
//# sourceMappingURL=hrAccount.js.map