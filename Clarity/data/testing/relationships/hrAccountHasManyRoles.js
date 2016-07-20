"use strict";
var HrAccount = require("../HrAccount");
var Role = require("../Role");
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