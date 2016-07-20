import HrAccount = require("../HrAccount");
import Role = require("../Role");

export = {
    type: HrAccount,
    hasKey: "id",
    hasMany: "roles",
    ofType: Role,
    withKey: "id",
    withForeignKey: "hrAccountId",
    withOne: "hrAccount"
}

