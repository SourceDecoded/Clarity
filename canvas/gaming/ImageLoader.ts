import Future = require("../../async/Future");

class ImageLoader {
    load(source: string) {
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
    }
};

export = ImageLoader;