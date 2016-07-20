"use strict";
var Rect = require("../Rect");
var Style = (function () {
    function Style() {
        this.backgroundColor = {
            red: 0,
            green: 0,
            blue: 0,
            alpha: 1
        };
    }
    Style.prototype.createRgba = function (rgba) {
        return "rgba(" + rgba.red + "," + rgba.green + "," + rgba.blue + "," + rgba.alpha + ")";
    };
    Style.prototype.addedToView = function (view) {
        this.view = view;
    };
    Style.prototype.draw = function (context, viewRect) {
        var intersection = Rect.getIntersection(this.view, viewRect);
        if (intersection) {
            context.fillStyle = this.createRgba(this.backgroundColor);
            context.fillRect(intersection.x - viewRect.x, intersection.y - viewRect.y, intersection.width, intersection.height);
        }
    };
    return Style;
}());
module.exports = Style;
//# sourceMappingURL=Style.js.map