import EdmPackage = require("../Edm");
import person = require("./model/person");
import permission = require("./model/permission");
import phoneNumber = require("./model/phoneNumber");
import address = require("./model/address");
import hrAccount = require("./model/hrAccount");
import role = require("./model/role");
import personToPermission = require("./model/personToPermission");
import personHasManyAddresses = require("./relationships/personHasManyAddresses");
import personHasManyPermissions = require("./relationships/personHasManyPermissions");
import personHasManyPhoneNumbers = require("./relationships/personHasManyPhoneNumbers");
import personHasOneHrAccount = require("./relationships/personHasOneHrAccount");
import hrAccountHasManyRoles = require("./relationships/hrAccountHasManyRoles");


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

export = Edm;
