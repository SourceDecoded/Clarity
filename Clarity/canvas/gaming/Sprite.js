"use strict";
var Sprite = (function () {
    function Sprite() {
        this.angle = 0;
        this.angleVelocity = 0;
        this.force = {
            x: 0,
            y: 0
        };
        this.offset = {
            x: 0,
            y: 0
        };
        this.velocity = {
            x: null,
            y: null
        };
        this.vertices = [];
        this.positionOnSource = {
            x: 0,
            y: 0,
            width: 0,
            height: 0
        };
    }
    return Sprite;
}());
module.exports = Sprite;
//# sourceMappingURL=Sprite.js.map