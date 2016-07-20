import ODataAnnotation = require("../../odata4/ODataAnnotation");
import EdmPackage = require("../../data/Edm");

class PhoneNumberType {
    static annotations = [new ODataAnnotation("Namespace.PhoneNumberType")];
    static None;
    static Home;
    static Work;
}

PhoneNumberType.None = new EdmPackage.Enum(0);
PhoneNumberType.None.name = "None";

PhoneNumberType.Home = new EdmPackage.Enum(1);
PhoneNumberType.Home.name = "Home";

PhoneNumberType.Work = new EdmPackage.Enum(2);
PhoneNumberType.Work.name = "Work";

export = PhoneNumberType;