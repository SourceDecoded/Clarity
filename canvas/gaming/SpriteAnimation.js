"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var Animation = require("./Animation");
var Rect = require("../Rect");
var Matter = require("matter-js");
var SpriteAnimation = (function (_super) {
    __extends(SpriteAnimation, _super);
    function SpriteAnimation(imageCache, rigidBody, sprites) {
        if (sprites === void 0) { sprites = []; }
        _super.call(this);
        this.sprites = sprites;
        this.currentIndex = 0;
        this.sourceToCanvas = {};
        this.imageCache = imageCache;
        this.rigidBody = rigidBody;
        this.eventDelegate = {
            onEnd: function () {
            },
            onStart: function () {
            }
        };
        this.repeat = Infinity;
        this.play();
    }
    SpriteAnimation.prototype.onTick = function (progress) {
        this.currentIndex = Math.floor(this.sprites.length * progress);
        this.currentIndex = this.currentIndex >= 0 ? this.currentIndex : 0;
        this.currentIndex = this.currentIndex < this.sprites.length ? this.currentIndex : this.sprites.length - 1;
    };
    SpriteAnimation.prototype.update = function (delta) {
        _super.prototype.update.call(this, delta);
        this.updateAngle();
        this.updateVertices();
        this.updateVelocity();
        if (this.currentIndex === 0) {
            this.onStart();
        }
        if (this.currentIndex === this.sprites.length - 1) {
            this.onEnd();
        }
    };
    SpriteAnimation.prototype.updateVertices = function () {
        //var sprite = this.sprites[this.currentIndex];
        //var vertices = sprite.vertices;
        //TODO: Update vertices if they are differnt than the current sprite.
    };
    SpriteAnimation.prototype.updateAngle = function () {
        Matter.Body.setAngle(this.rigidBody.body, 0);
        Matter.Body.setAngularVelocity(this.rigidBody.body, 0);
    };
    SpriteAnimation.prototype.updateVelocity = function () {
        var sprite = this.sprites[this.currentIndex];
        var velocity = sprite.velocity;
        var body = this.rigidBody.body;
        var appliedVelocity = {
            x: body.velocity.x,
            y: body.velocity.y
        };
        if (velocity.x !== null) {
            appliedVelocity.x = velocity.x;
        }
        if (velocity.y !== null) {
            appliedVelocity.y = velocity.y;
        }
        Matter.Body.setVelocity(body, appliedVelocity);
    };
    SpriteAnimation.prototype.draw = function (context, viewRect) {
        var sprite = this.sprites[this.currentIndex];
        var canvas = this.imageCache.getCanvas(sprite.source);
        var intersection = Rect.getIntersection(this.rigidBody.view, viewRect);
        if (sprite && intersection && this.rigidBody) {
            var body = this.rigidBody.body;
            var position = this.rigidBody.body.position;
            var index = Math.floor(this.currentIndex);
            var x = Math.ceil(position.x - viewRect.x);
            var y = Math.ceil(position.y - viewRect.y);
            context.translate(x, y);
            context.rotate(body.angle);
            var placementX = Math.floor(-(this.rigidBody.width / 2));
            var placementY = Math.floor(-(this.rigidBody.height / 2));
            var spriteRect = sprite.positionOnSource;
            context.drawImage(canvas, Math.ceil(spriteRect.x), Math.floor(spriteRect.y), Math.ceil(spriteRect.width), Math.ceil(spriteRect.height), Math.ceil(placementX + sprite.offset.x), Math.ceil(placementY + sprite.offset.y), Math.ceil(spriteRect.width), Math.ceil(spriteRect.height));
            context.rotate(-body.angle);
            context.translate(-x, -y);
        }
    };
    SpriteAnimation.prototype.onEnd = function () {
        if (typeof this.eventDelegate.onEnd === "function") {
            this.eventDelegate.onEnd();
        }
    };
    SpriteAnimation.prototype.onStart = function () {
        if (typeof this.eventDelegate.onStart === "function") {
            this.eventDelegate.onStart;
        }
    };
    return SpriteAnimation;
}(Animation));
module.exports = SpriteAnimation;
//# sourceMappingURL=SpriteAnimation.js.map