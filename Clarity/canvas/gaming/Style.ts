import IRgba = require("./IRgba");
import View = require("../View");
import Rect = require("../Rect");

class Style {
    backgroundColor: IRgba;
    view: View;

    constructor() {
        this.backgroundColor = {
            red: 0,
            green: 0,
            blue: 0,
            alpha: 1
        };
    }

    createRgba(rgba: IRgba) {
        return "rgba(" + rgba.red + "," + rgba.green + "," + rgba.blue + "," + rgba.alpha + ")";
    }

    addedToView(view: View) {
        this.view = view;
    }

    draw(context: CanvasRenderingContext2D, viewRect) {
        var intersection = Rect.getIntersection(this.view, viewRect);
        if (intersection) {
            context.fillStyle = this.createRgba(this.backgroundColor);
            context.fillRect(intersection.x - viewRect.x, intersection.y - viewRect.y, intersection.width, intersection.height);
        }
    }
}

export = Style;