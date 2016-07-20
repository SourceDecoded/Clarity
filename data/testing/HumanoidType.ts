import ODataAnnotation = require("../../odata4/ODataAnnotation");
import EdmPackage = require("../../data/Edm");

class HumanoidType {
    static annotations = [new ODataAnnotation("Namespace.HumanoidType")];
    static None;
    static Human;
    static Vulcan;
}

HumanoidType.None = new EdmPackage.Enum(0);
HumanoidType.None.name = "None";

HumanoidType.Human = new EdmPackage.Enum(1);
HumanoidType.Human.name = "Human";

HumanoidType.Vulcan = new EdmPackage.Enum(2);
HumanoidType.Vulcan.name = "Vulcan";

export = HumanoidType;
