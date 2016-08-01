"use strict";
const Person = require("../Person");
const Permission = require("../Permission");
const PersonToPermission = require("../PersonToPermission");
module.exports = {
    type: Person,
    hasKey: "id",
    hasForeignKey: "permissionId",
    hasMany: "permissions",
    ofType: Permission,
    withKey: "id",
    withForeignKey: "personId",
    withMany: "people",
    usingMappingType: PersonToPermission
};
//# sourceMappingURL=personHasManyPermissions.js.map