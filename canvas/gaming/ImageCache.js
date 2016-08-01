"use strict";
var Future = require("../../async/Future");
var ImageCache = (function () {
    function ImageCache(imageLoader) {
        this.imageToCanvas = {};
        this.imageLoader = imageLoader;
    }
    ImageCache.prototype.load = function (source) {
        var _this = this;
        return this.imageLoader.load(source).chain(function (image) {
            var canvas = document.createElement("canvas");
            canvas.width = image.width;
            canvas.height = image.height;
            canvas.getContext("2d").drawImage(image, 0, 0);
            _this.imageToCanvas[source] = canvas;
            return canvas;
        });
    };
    ImageCache.prototype.loadAll = function (sources) {
        var _this = this;
        var futures = sources.map(function (source) {
            return _this.load(source);
        });
        return Future.all(futures);
    };
    ImageCache.prototype.getCanvas = function (source) {
        var canvas = this.imageToCanvas[source];
        if (!canvas) {
            throw new Error("Couldn't find image '" + source + "' in cache.");
        }
        return canvas;
    };
    return ImageCache;
}());
module.exports = ImageCache;
//# sourceMappingURL=ImageCache.js.map