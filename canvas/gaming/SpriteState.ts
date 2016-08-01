import IState = require("./IState");
import IRect = require("../IRect");
import SpriteAnimation = require("./SpriteAnimation");
import CharacterController = require("./CharacterController");

class SpriteState implements IState {
    name: string;
    spriteAnimation: SpriteAnimation;
    controller: CharacterController;

    constructor(spriteAnimation: SpriteAnimation) {
        this.spriteAnimation = spriteAnimation;
    }

    activated() { }

    deactivated() { }

    setCharacterController(controller: CharacterController) {
        this.controller = controller;
    }

    update(delta) {
        this.beforeUpdate();
        this.spriteAnimation.update(delta);
        this.afterUpdate();
    }

    draw(canvas: CanvasRenderingContext2D, viewRect: IRect) {
        this.beforeDraw();
        this.spriteAnimation.draw(canvas, viewRect);
        this.afterDraw();
    }

    beforeDraw() { }

    afterDraw() { }

    beforeUpdate() { };

    afterUpdate() { };


}

export = SpriteState;