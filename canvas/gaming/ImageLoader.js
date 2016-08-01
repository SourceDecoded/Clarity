"use strict";
var Future = require("../../async/Future");
var ImageLoader = (function () {
    function ImageLoader() {
    }
    ImageLoader.prototype.load = function (source) {
        return new Future(function (setValue, setError) {
            var image = new Image();
            image.onload = function () {
                setValue(image);
            };
            image.onerror = function (error) {
                setError(error);
            };
            image.src = source;
        });
    };
    return ImageLoader;
}());
;
module.exports = ImageLoader;
//# sourceMappingURL=ImageLoader.js.map