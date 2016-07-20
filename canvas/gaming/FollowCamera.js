"use strict";
var FollowCamera = (function () {
    function FollowCamera(canvas, rootView, followView) {
        if (!canvas || !rootView || !followView) {
            throw new Error("All arguments are expected.");
        }
        this.x = 0;
        this.y = 0;
        this.canvas = canvas;
        this.context = canvas.getContext("2d");
        this.rootView = rootView;
        this.followView = followView;
        this.canvas = canvas;
        this.width = canvas.width;
        this.height = canvas.height;
        this.offScreenCanvas = document.createElement("canvas");
        this.offScreenCanvas.width = canvas.width;
        this.offScreenCanvas.height = canvas.height;
        this.offscreenContext = this.offScreenCanvas.getContext("2d");
    }
    FollowCamera.prototype.centerFollowedView = function () {
        var centerLeft = (this.width / 2) - (this.followView.width / 2);
        var centerTop = (this.height / 2) - (this.followView.height / 2);
        var x = this.followView.x;
        var y = this.followView.y;
        this.x = Math.floor(x - centerLeft);
        this.y = Math.floor(y - centerTop);
    };
    FollowCamera.prototype.withinBounds = function () {
        var x = this.x;
        var y = this.y;
        var right = Math.min(x + this.width, this.rootView.width);
        var bottom = Math.min(y + this.height, this.rootView.height);
        x = right - this.width;
        y = bottom - this.height;
        this.x = Math.floor(x > 0 ? x : 0);
        this.y = Math.floor(y > 0 ? y : 0);
    };
    FollowCamera.prototype.update = function (delta) {
        var context = this.context;
        this.centerFollowedView();
        this.withinBounds();
        context.clearRect(0, 0, this.width, this.height);
        this.rootView.draw(this.offscreenContext, this);
        this.rootView.update(delta);
        context.drawImage(this.offScreenCanvas, 0, 0);
    };
    return FollowCamera;
}());
module.exports = FollowCamera;
//# sourceMappingURL=FollowCamera.js.map