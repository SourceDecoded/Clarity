"use strict";
var Person = require("../Person");
var Permission = require("../Permission");
var PersonToPermission = require("../PersonToPermission");
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