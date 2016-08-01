"use strict";
const Future = require("../../async/Future");
class ImageCache {
    constructor(imageLoader) {
        this.imageToCanvas = {};
        this.imageLoader = imageLoader;
    }
    load(source) {
        return this.imageLoader.load(source).chain((image) => {
            var canvas = document.createElement("canvas");
            canvas.width = image.width;
            canvas.height = image.height;
            canvas.getContext("2d").drawImage(image, 0, 0);
            this.imageToCanvas[source] = canvas;
            return canvas;
        });
    }
    loadAll(sources) {
        var futures = sources.map((source) => {
            return this.load(source);
        });
        return Future.all(futures);
    }
    getCanvas(source) {
        var canvas = this.imageToCanvas[source];
        if (!canvas) {
            throw new Error("Couldn't find image '" + source + "' in cache.");
        }
        return canvas;
    }
}
module.exports = ImageCache;
//# sourceMappingURL=ImageCache.js.map