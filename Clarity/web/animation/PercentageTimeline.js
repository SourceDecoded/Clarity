"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var Timeline = require("./Timeline");
var Animation = require("./Animation");
var PercentageTimeline = (function (_super) {
    __extends(PercentageTimeline, _super);
    function PercentageTimeline(duration) {
        _super.call(this);
        this._duration = duration;
    }
    PercentageTimeline.prototype._calculateAnimations = function () {
        var self = this;
        self._animationItems.getValues().forEach(function (animationItem) {
            var offset = animationItem.startAt * self._duration;
            var duration = (animationItem.endAt * self._duration) - offset;
            animationItem.offset = offset;
            animationItem.animation._duration = duration;
        });
    };
    PercentageTimeline.prototype.add = function () {
        var self = this;
        var animationItems = Array.prototype.slice.call(arguments, 0);
        animationItems.forEach(function (animationItem) {
            if (typeof animationItem.startAt !== "number") {
                throw new Error("animationItem needs to have an startAt percentage property set.");
            }
            if (typeof animationItem.endAt !== "number") {
                throw new Error("animationItem needs to have an endAt percentage property set.");
            }
            if (!(animationItem.animation instanceof Animation)) {
                throw new Error("animationItem needs to have an animation property set thats an instanceof Animation.");
            }
            if ((animationItem.startAt < 0 && animationItem.startAt > 1) || (animationItem.endAt < 0 && animationItem.endAt > 1)) {
                throw new Error("startAt and endAt need to be within 0-1.");
            }
            if (animationItem.startAt > animationItem.endAt) {
                throw new Error("endAt needs to be greater than startAt.");
            }
            self._animationItems.add(animationItem, animationItem);
            self._calculateAnimations();
            if (animationItem.animation instanceof Timeline) {
                animationItem.animation._calculateAnimations();
            }
        });
    };
    ;
    return PercentageTimeline;
}(Timeline));
//# sourceMappingURL=PercentageTimeline.js.map