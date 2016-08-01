"use strict";
class Animation {
    constructor() {
        this.elapsedTime = 0;
        this.progress = 0;
        this.iteration = 0;
        this.repeat = 0;
        this.repeatDirection = 0;
        this.startTime = 0;
        this.progress = 0;
        this.state = "stopped";
        this.direction = "forward";
        this.timeScale = 1;
        this.duration = 0;
    }
    update(delta) {
        if (this.state === "running") {
            this.elapsedTime += (delta * this.timeScale);
            if (this.elapsedTime > this.duration) {
                if (this.iteration < this.repeat) {
                    var difference = this.elapsedTime - this.duration;
                    if (this.repeatDirection === 1 && this.direction === "forward") {
                        this.direction = "reverse";
                        this.progress = 1 - (difference / this.duration);
                    }
                    else if (this.repeatDirection === 1 && this.direction === "reverse") {
                        this.direction = "forward";
                        this.progress = difference / this.duration;
                    }
                    else if (this.repeatDirection === 0 && this.direction === "reverse") {
                        this.progress = 1 - (difference / this.duration);
                    }
                    else if (this.repeatDirection === 0 && this.direction === "forward") {
                        this.progress = difference / this.duration;
                    }
                    this.iteration++;
                    this.elapsedTime = difference;
                }
                else {
                    this.elapsedTime = this.duration;
                    if (this.direction === "forward") {
                        this.progress = 1;
                    }
                    else {
                        this.progress = 0;
                    }
                    this.state = "stopped";
                }
            }
            else {
                if (this.direction === "forward") {
                    this.progress = this.elapsedTime / this.duration;
                }
                else {
                    this.progress = 1 - (this.elapsedTime / this.duration);
                }
            }
            this.onTick(this.progress);
        }
    }
    reverse() {
        this.direction = "reverse";
        this.state = "running";
    }
    play() {
        this.direction = "forward";
        this.state = "running";
    }
    stop() {
        this.state = "stopped";
    }
    seek(decimalFraction) {
        this.elapsedTime = this.duration * decimalFraction;
        this.progress = decimalFraction;
    }
    onTick(progress) {
    }
}
module.exports = Animation;
//# sourceMappingURL=Animation.js.map