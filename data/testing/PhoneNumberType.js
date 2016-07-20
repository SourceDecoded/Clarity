"use strict";
var ODataAnnotation = require("../../odata4/ODataAnnotation");
var EdmPackage = require("../../data/Edm");
var PhoneNumberType = (function () {
    function PhoneNumberType() {
    }
    PhoneNumberType.annotations = [new ODataAnnotation("Namespace.PhoneNumberType")];
    return PhoneNumberType;
}());
PhoneNumberType.None = new EdmPackage.Enum(0);
PhoneNumberType.None.name = "None";
PhoneNumberType.Home = new EdmPackage.Enum(1);
PhoneNumberType.Home.name = "Home";
PhoneNumberType.Work = new EdmPackage.Enum(2);
PhoneNumberType.Work.name = "Work";
module.exports = PhoneNumberType;
//# sourceMappingURL=PhoneNumberType.js.map