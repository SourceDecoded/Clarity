import HrAccount = require("../HrAccount");
import EdmPackage = require("../../Edm");

export = {
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

