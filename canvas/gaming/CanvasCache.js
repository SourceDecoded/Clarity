"use strict";
const ImageCache = require("./ImageCache");
const ImageLoader = require("./ImageLoader");
function CanvasCache(target) {
    target.prototype.imageCache = exports.cache;
}
exports.CanvasCache = CanvasCache;
exports.cache = new ImageCache(new ImageLoader());
//# sourceMappingURL=CanvasCache.js.map