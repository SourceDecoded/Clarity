"use strict";
var SpriteState = (function () {
    function SpriteState(spriteAnimation) {
        this.spriteAnimation = spriteAnimation;
    }
    SpriteState.prototype.activated = function () { };
    SpriteState.prototype.deactivated = function () { };
    SpriteState.prototype.setCharacterController = function (controller) {
        this.controller = controller;
    };
    SpriteState.prototype.update = function (delta) {
        this.beforeUpdate();
        this.spriteAnimation.update(delta);
        this.afterUpdate();
    };
    SpriteState.prototype.draw = function (canvas, viewRect) {
        this.beforeDraw();
        this.spriteAnimation.draw(canvas, viewRect);
        this.afterDraw();
    };
    SpriteState.prototype.beforeDraw = function () { };
    SpriteState.prototype.afterDraw = function () { };
    SpriteState.prototype.beforeUpdate = function () { };
    ;
    SpriteState.prototype.afterUpdate = function () { };
    ;
    return SpriteState;
}());
module.exports = SpriteState;
//# sourceMappingURL=SpriteState.js.map