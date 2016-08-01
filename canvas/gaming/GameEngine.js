"use strict";
var FRAMES_PER_SECOND = 1000 / 60;
class GameEngine {
    constructor(camera, physicsEngine, userInputManager) {
        this.camera = camera;
        this.physicsEngine = physicsEngine;
        this.userInputManager = userInputManager;
    }
    step() {
        this._time += FRAMES_PER_SECOND;
        this.physicsEngine.update();
        this.camera.update(FRAMES_PER_SECOND);
        this.userInputManager.update();
    }
    get time() {
        return this._time;
    }
    run() {
        if (!this.isPlaying) {
            this.isPlaying = true;
            var run = () => {
                this.step();
                requestAnimationFrame(run);
            };
            this.animationFrame = requestAnimationFrame(run);
        }
    }
    stop() {
        if (this.isPlaying) {
            cancelAnimationFrame(this.animationFrame);
        }
    }
}
module.exports = GameEngine;
//# sourceMappingURL=GameEngine.js.map