"use strict";
const Rect = require("../Rect");
class Style {
    constructor() {
        this.backgroundColor = {
            red: 0,
            green: 0,
            blue: 0,
            alpha: 1
        };
    }
    createRgba(rgba) {
        return "rgba(" + rgba.red + "," + rgba.green + "," + rgba.blue + "," + rgba.alpha + ")";
    }
    addedToView(view) {
        this.view = view;
    }
    draw(context, viewRect) {
        var intersection = Rect.getIntersection(this.view, viewRect);
        if (intersection) {
            context.fillStyle = this.createRgba(this.backgroundColor);
            context.fillRect(intersection.x - viewRect.x, intersection.y - viewRect.y, intersection.width, intersection.height);
        }
    }
}
module.exports = Style;
//# sourceMappingURL=Style.js.map