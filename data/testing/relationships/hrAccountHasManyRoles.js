"use strict";
const HrAccount = require("../HrAccount");
const Role = require("../Role");
module.exports = {
    type: HrAccount,
    hasKey: "id",
    hasMany: "roles",
    ofType: Role,
    withKey: "id",
    withForeignKey: "hrAccountId",
    withOne: "hrAccount"
};
//# sourceMappingURL=hrAccountHasManyRoles.js.map