﻿import IRect = require("./IRect");

class Rect implements IRect {
    x: number;
    y: number;
    width: number;
    height: number;

    constructor(x: number = 0, y: number = 0, width: number = 0, height: number = 0) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }

    public static getIntersection(rect1, rect2) {
        var result = {
            x: 0,
            y: 0,
            width: 0,
            height: 0
        };

        var rectBottom = rect2.y + rect2.height;
        var bottom = rect1.y + rect1.height;
        var rectRight = rect2.x + rect2.width;
        var right = rect1.x + rect1.width;

        result.x = Math.max(rect1.x, rect2.x);
        result.y = Math.max(rect1.y, rect2.y);

        bottom = Math.min(bottom, rectBottom);
        right = Math.min(right, rectRight);

        result.width = right - result.x;
        result.height = bottom - result.y;

        if (result.width <= 0 || result.height <= 0) {
            return null;
        }

        return result;
    }
}

export = Rect;
