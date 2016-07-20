"use strict";
var FRAMES_PER_SECOND = 1000 / 60;
var GameEngine = (function () {
    function GameEngine(camera, physicsEngine, userInputManager) {
        this.camera = camera;
        this.physicsEngine = physicsEngine;
        this.userInputManager = userInputManager;
    }
    GameEngine.prototype.step = function () {
        this._time += FRAMES_PER_SECOND;
        this.physicsEngine.update();
        this.camera.update(FRAMES_PER_SECOND);
        this.userInputManager.update();
    };
    Object.defineProperty(GameEngine.prototype, "time", {
        get: function () {
            return this._time;
        },
        enumerable: true,
        configurable: true
    });
    GameEngine.prototype.run = function () {
        var _this = this;
        if (!this.isPlaying) {
            this.isPlaying = true;
            var run = function () {
                _this.step();
                requestAnimationFrame(run);
            };
            this.animationFrame = requestAnimationFrame(run);
        }
    };
    GameEngine.prototype.stop = function () {
        if (this.isPlaying) {
            cancelAnimationFrame(this.animationFrame);
        }
    };
    return GameEngine;
}());
module.exports = GameEngine;
//# sourceMappingURL=GameEngine.js.map