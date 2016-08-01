"use strict";
class SpriteState {
    constructor(spriteAnimation) {
        this.spriteAnimation = spriteAnimation;
    }
    activated() { }
    deactivated() { }
    setCharacterController(controller) {
        this.controller = controller;
    }
    update(delta) {
        this.beforeUpdate();
        this.spriteAnimation.update(delta);
        this.afterUpdate();
    }
    draw(canvas, viewRect) {
        this.beforeDraw();
        this.spriteAnimation.draw(canvas, viewRect);
        this.afterDraw();
    }
    beforeDraw() { }
    afterDraw() { }
    beforeUpdate() { }
    ;
    afterUpdate() { }
    ;
}
module.exports = SpriteState;
//# sourceMappingURL=SpriteState.js.map