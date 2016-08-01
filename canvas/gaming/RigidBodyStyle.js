"use strict";
const RigidBody = require("./RigidBody");
const Rect = require("../Rect");
class RigidBodyStyle {
    constructor() {
        this.background = {
            color: {
                red: 0,
                blue: 0,
                green: 0,
                alpha: 1
            },
            image: {
                object: null,
                offsetX: 0,
                offsetY: 0
            },
            clip: false,
        };
    }
    addedToView(view) {
        this.view = view;
        this.rigidBody = this.view.getBehaviors(RigidBody)[0];
        if (!this.rigidBody) {
            throw new Error("RigidBodyStyle must have a RigidBody on the view too.");
        }
    }
    createRgba(rgba) {
        return "rgba(" + rgba.red + "," + rgba.green + "," + rgba.blue + "," + rgba.alpha + ")";
    }
    drawBackground(context, viewRect, intersection) {
        if (this.background.color !== null) {
            var pointIndex;
            var body = this.rigidBody.body;
            var position = body.position;
            var vertices = body.vertices;
            if (body.circleRadius) {
                context.beginPath();
                context.arc(position.x - viewRect.x, position.y - viewRect.y, body.circleRadius, 0, 2 * Math.PI);
                context.closePath();
            }
            else {
                context.beginPath();
                context.moveTo(vertices[0].x - viewRect.x, vertices[0].y - viewRect.y);
                for (pointIndex = 1; pointIndex < vertices.length; pointIndex++) {
                    context.lineTo(vertices[pointIndex].x - viewRect.x, vertices[pointIndex].y - viewRect.y);
                }
                context.closePath();
            }
            context.fillStyle = this.createRgba(this.background.color);
            context.fill();
            if (this.background.image.object) {
                var x = position.x - viewRect.x;
                var y = position.y - viewRect.y;
                context.translate(x, y);
                context.rotate(body.angle);
                if (this.background.clip) {
                    context.clip();
                }
                var placementX = Math.floor(-(this.rigidBody.width / 2));
                var placementY = Math.floor(-(this.rigidBody.height / 2));
                context.drawImage(this.background.image.object, placementX + this.background.image.offsetX, placementY + this.background.image.offsetY, this.background.image.object.width, this.background.image.object.height);
                context.rotate(-body.angle);
                context.translate(-x, -y);
            }
        }
    }
    draw(context, viewRect) {
        var intersection = Rect.getIntersection(this.view, viewRect);
        if (intersection && this.rigidBody) {
            this.drawBackground(context, viewRect, intersection);
        }
    }
}
module.exports = RigidBodyStyle;
//# sourceMappingURL=RigidBodyStyle.js.map