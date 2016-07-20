import ImageCache = require("./ImageCache");
import ImageLoader = require("./ImageLoader");

export function CanvasCache(target) {
    target.prototype.imageCache = cache;
}

export var cache = new ImageCache(new ImageLoader());

