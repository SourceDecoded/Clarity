"use strict";
var Person = (function () {
    function Person() {
        this.id = null;
        this.humanoidType = 0;
        this.firstName = null;
        this.lastName = null;
        this.age = null;
        this.hrAccount = null;
        this.dateOfBirth = null;
        this.placeOfBirth = null;
        this.addresses = [];
        this.phoneNumbers = [];
        this.permissions = [];
    }
    return Person;
}());
module.exports = Person;
//# sourceMappingURL=Person.js.map