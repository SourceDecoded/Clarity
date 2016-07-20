import IRect = require("../IRect");

interface IDraw {
    draw(canvas: CanvasRenderingContext2D, viewRect: IRect): void;
}

export = IDraw;