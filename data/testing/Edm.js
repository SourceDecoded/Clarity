"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var EdmPackage = require("../Edm");
var person = require("./model/person");
var permission = require("./model/permission");
var phoneNumber = require("./model/phoneNumber");
var address = require("./model/address");
var hrAccount = require("./model/hrAccount");
var role = require("./model/role");
var personToPermission = require("./model/personToPermission");
var personHasManyAddresses = require("./relationships/personHasManyAddresses");
var personHasManyPermissions = require("./relationships/personHasManyPermissions");
var personHasManyPhoneNumbers = require("./relationships/personHasManyPhoneNumbers");
var personHasOneHrAccount = require("./relationships/personHasOneHrAccount");
var hrAccountHasManyRoles = require("./relationships/hrAccountHasManyRoles");
var Edm = (function (_super) {
    __extends(Edm, _super);
    function Edm() {
        _super.call(this);
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
    return Edm;
}(EdmPackage.Edm));
module.exports = Edm;
//# sourceMappingURL=Edm.js.map