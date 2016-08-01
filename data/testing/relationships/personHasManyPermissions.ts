import Person = require("../Person");
import Permission = require("../Permission");
import PersonToPermission = require("../PersonToPermission");

export =  {
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

