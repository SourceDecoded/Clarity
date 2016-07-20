var emptyFn = function () { };
var playingState = {
    play: emptyFn,
    pause: function (timer) {
        var lastDuration = timer.currentDuration();
        timer.durations.push(lastDuration);
        timer.state = pausedState;
    },
    now: function (timer) {
        return timer.durations.reduce(function (accumlatedValue, next) {
            return accumlatedValue += next;
        }, 0) + timer.currentDuration();
    },
    setTimeScale: function (timer, scale) {
        timer.pause();
        timer.timeScale = scale;
        timer.play();
    }
};
var pausedState = {
    play: function (timer) {
        timer.lastStartTime = performance.now();
        timer.state = playingState;
    },
    pause: emptyFn,
    now: function (timer) {
        return timer.durations.reduce(function (accumlatedValue, next) {
            return accumlatedValue += next;
        }, 0);
    },
    setTimeScale: function (timer, scale) {
        timer.timeScale = scale;
    }
};
var Timer = (function () {
    function Timer() {
        this.performance = performance;
        this.timeScale = 1;
        this.lastStartTime = 0;
        this.durations = [];
        this.state = pausedState;
    }
    Timer.prototype.currentDuration = function () {
        return (this.performance.now() - this.lastStartTime) * this.timeScale;
    };
    Timer.prototype.play = function () {
        this.state.play(this);
    };
    Timer.prototype.pause = function () {
        this.state.pause(this);
    };
    Timer.prototype.now = function () {
        return this.state.now(this);
    };
    Timer.prototype.setTimeScale = function (value) {
        if (typeof value !== "number" || value < 0) {
            throw new Error("value needs to be a number and greater than 0.");
        }
        this.state.setTimeScale(this, value);
    };
    return Timer;
})();
//export = Timer;
//# sourceMappingURL=Timer.js.map