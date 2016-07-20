import InMemoryService = require("../services/InMemoryService");
import Edm = require("./Edm");
import Person = require("./Person");
import PhoneNumber = require("./PhoneNumber");
import Permission = require("./Permission");
import Address = require("./Address");
import PersonToPermission = require("./PersonToPermission");
import HrAccount = require("./HrAccount");

export = function () {
    var edm = new Edm();
    var filledService = new InMemoryService(edm);
    var emptyService = new InMemoryService(edm);

    var people = filledService.getDataStore(Person).getEntities();
    var phoneNumbers = filledService.getDataStore(PhoneNumber).getEntities();
    var addresses = filledService.getDataStore(Address).getEntities();
    var permissions = filledService.getDataStore(Permission).getEntities();
    var personToPermissions = filledService.getDataStore(PersonToPermission).getEntities();
    var hrAccounts = filledService.getDataStore(HrAccount).getEntities();

    var john = new Person();
    john.id = 1;
    john.firstName = "John";
    john.lastName = "Doe";
    john.age = 30;

    var jane = new Person();
    jane.id = 2;
    jane.firstName = "Jane";
    jane.lastName = "Doe";
    jane.age = 29;

    var johnsHrAccount = new HrAccount();
    johnsHrAccount.id = 1;
    johnsHrAccount.personId = 1;
    johnsHrAccount.accountId = 1;

    var janesHrAccount = new HrAccount();
    janesHrAccount.id = 2;
    janesHrAccount.personId = 2;
    janesHrAccount.accountId = 2;

    var johnsCellNumber = new PhoneNumber();
    johnsCellNumber.id = 1;
    johnsCellNumber.areacode = 435;
    johnsCellNumber.lineNumber = 5558500;
    johnsCellNumber.personId = 1;

    var janesCellNumber = new PhoneNumber();
    janesCellNumber.id = 2;
    janesCellNumber.areacode = 435;
    janesCellNumber.lineNumber = 5558000;
    janesCellNumber.personId = 2;

    var johnsAddress = new Address();
    johnsAddress.id = 1;
    johnsAddress.street = "#4 Privot Drive";
    johnsAddress.city = "London";
    johnsAddress.state = "London";
    johnsAddress.country = "England";
    johnsAddress.zip = "555-55555";
    johnsAddress.personId = 1;

    var janesAddress = new Address();
    janesAddress.id = 2;
    janesAddress.street = "#5 Privot Drive";
    janesAddress.city = "London";
    janesAddress.state = "London";
    janesAddress.country = "England";
    janesAddress.zip = "555-55555";
    janesAddress.personId = 2;

    var permission = new Permission();
    permission.id = 1;
    permission.name = "Enter House";

    var johnsPersonToPermission = new PersonToPermission();
    johnsPersonToPermission.personId = john.id;
    johnsPersonToPermission.permissionId = permission.id;

    var janesPersonToPermission = new PersonToPermission();
    janesPersonToPermission.personId = jane.id;
    janesPersonToPermission.permissionId = permission.id;

    people.add(john.id, john);
    people.add(jane.id, jane);
    hrAccounts.add(johnsHrAccount.id, johnsHrAccount);
    hrAccounts.add(janesHrAccount.id, janesHrAccount);
    phoneNumbers.add(johnsCellNumber.id, johnsCellNumber);
    phoneNumbers.add(janesCellNumber.id, janesCellNumber);
    addresses.add(johnsAddress.id, johnsAddress);
    addresses.add(janesAddress.id, janesAddress);
    permissions.add(permission.id, permission);
    personToPermissions.add(john.id + "_" + permission.id, johnsPersonToPermission);
    personToPermissions.add(jane.id + "_" + permission.id, janesPersonToPermission);

    return {
        filled: filledService,
        empty: emptyService
    };

};

