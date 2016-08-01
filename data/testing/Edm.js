"use strict";
const EdmPackage = require("../Edm");
const person = require("./model/person");
const permission = require("./model/permission");
const phoneNumber = require("./model/phoneNumber");
const address = require("./model/address");
const hrAccount = require("./model/hrAccount");
const role = require("./model/role");
const personToPermission = require("./model/personToPermission");
const personHasManyAddresses = require("./relationships/personHasManyAddresses");
const personHasManyPermissions = require("./relationships/personHasManyPermissions");
const personHasManyPhoneNumbers = require("./relationships/personHasManyPhoneNumbers");
const personHasOneHrAccount = require("./relationships/personHasOneHrAccount");
const hrAccountHasManyRoles = require("./relationships/hrAccountHasManyRoles");
class Edm extends EdmPackage.Edm {
    constructor() {
        super();
        this.addModel(person);
        this.addModel(permission);
        this.addModel(address);
        this.addModel(hrAccount);
        this.addModel(role);
        this.addModel(phoneNumber);
        this.addModel(personToPermission);
        this.addOneToOne(personHasOneHrAccount);
        this.addOneToMany(personHasManyAddresses);
        this.addOneToMany(personHasManyPhoneNumbers);
        this.addOneToMany(hrAccountHasManyRoles);
        this.addManyToMany(personHasManyPermissions);
    }
}
module.exports = Edm;
//# sourceMappingURL=Edm.js.map