﻿import Animation = require("./Animation");
import animationStateManager = require("./animationStateManager");
import Hashmap = require("../../collections/Hashmap");
import orderByDesc = require("../../array/orderByDesc");
import orderBy = require("../../array/orderBy");

var renderByOffset = function (animationItem) {
    return animationItem.offset;
};

var renderByOffsetAndDuration = function (animationItem) {
    return animationItem.offset + animationItem.animation._duration;
};

class Timeline extends Animation {
    _animationItems;
    _iterationCount;
    _lastCurrentTime;

    constructor(config?) {
        super(config);

        this._animationItems = new Hashmap();
        this._iterationCount = 1;
        this._lastCurrentTime = 0;
    }

    calculateDuration() {
        return this._animationItems.getValues().reduce(function (duration, animationItem) {
            var animationTotalDuration = animationItem.offset + animationItem.animation._duration;
            if (animationTotalDuration > duration) {
                return animationTotalDuration;
            }
            return duration;
        }, 0);
    }

    add() {
        var animationItems = Array.prototype.slice.call(arguments, 0);
        var self = this;

        animationItems.forEach(function (animationItem) {
            if (typeof animationItem.offset !== "number") {
                throw new Error("animationItem needs to have an offset property set.");
            }

            if (!(animationItem.animation instanceof Animation)) {
                throw new Error("animationItem needs to have an animation property set thats an instanceof Animation.");
            }

            self._animationItems.add(animationItem, animationItem);
        });

        this._duration = this.calculateDuration();
    }

    remove(animationItem) {
        this._animationItems.remove(animationItem);
    }

    render() {
        var progress = this._progress;
        var timelineDuration = this._duration;
        var currentTime = progress * timelineDuration;
        var timeScale = this._timeScale;
        var now = Date.now();
        var currentState = this._currentState;

        var animationsItems = this._animationItems.getValues();

        if (this._currentState === animationStateManager.reverseState ||
            this._currentState === animationStateManager.reversePausedState) {
            animationsItems.orderByDesc(renderByOffsetAndDuration);
        } else {
            animationsItems.orderBy(renderByOffset);
        }

        animationsItems.forEach(function (animationItem) {
            var duration = animationItem.animation._duration;
            var offset = animationItem.offset;
            var animation = animationItem.animation;

            if (currentState === animationStateManager.reverseState) {
                animation._currentState = animationStateManager.reversePausedState;
            } else {
                animation._currentState = animationStateManager.forwardPausedState;
            }

            animation.setTimeScale(timeScale);

            if (currentTime >= offset && currentTime <= offset + duration) {
                var difference = currentTime - offset;
                var animationProgress = difference / duration;

                animation.seek(animationProgress, now);
            }

            if (currentTime > offset + duration && animation._progress !== 1) {
                if (animation._progress < 1) {
                    animation.seek(1);
                    animation.stop();
                } else {
                    animation.stop();
                    animation.seek(1);
                }
            }

            if (currentTime < offset && animation._progress !== 0) {
                if (animation._progress > 0) {
                    animation.seek(0);
                    animation.stop();
                } else {
                    animation.stop();
                    animation.seek(0);
                }
            }

        });

        return this;
    }

}

export = Timeline;