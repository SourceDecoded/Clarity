"use strict";
const ODataAnnotation = require("../../odata4/ODataAnnotation");
const EdmPackage = require("../../data/Edm");
class HumanoidType {
}
HumanoidType.annotations = [new ODataAnnotation("Namespace.HumanoidType")];
HumanoidType.None = new EdmPackage.Enum(0);
HumanoidType.None.name = "None";
HumanoidType.Human = new EdmPackage.Enum(1);
HumanoidType.Human.name = "Human";
HumanoidType.Vulcan = new EdmPackage.Enum(2);
HumanoidType.Vulcan.name = "Vulcan";
module.exports = HumanoidType;
//# sourceMappingURL=HumanoidType.js.map