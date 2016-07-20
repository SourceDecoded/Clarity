/// <reference path="../../../typings/matter-js.d.ts" />
import Matter = require("matter-js");
import View = require("../View");

class RigidBody {
    type: string;
    body: Matter.Body;
    view: View;
    width: number;
    height: number;

    constructor(rigidBody: Matter.Body) {
        this.body = rigidBody;
        this.type = "body";
        this.width = 0;
        this.height = 0;
    }

    private updateBounds(view) {
        if ((<any>this.body).circleRadius) {
            var radius = (<any>this.body).circleRadius;
            var diameter = radius * 2;
            view.y = this.body.position.y - radius;
            view.x = this.body.position.x - radius;
            view.width = diameter;
            view.height = diameter;
        } else {
            var vertices = this.body.vertices;
            var top = vertices[0].y || 0;
            var left = vertices[0].x || 0;
            var right = 0;
            var bottom = 0;

            for (var index = 0; index < vertices.length; index++) {
                right = Math.ceil(Math.max(right, vertices[index].x));
                bottom = Math.ceil(Math.max(bottom, vertices[index].y));
                top = Math.ceil(Math.min(top, vertices[index].y));
                left = Math.ceil(Math.min(left, vertices[index].x));
            }

            view.x = left;
            view.y = top;
            view.width = right - left;
            view.height = bottom - top;
        }
    }

    addedToView(view: View) {
        this.view = view;
        this.updateBounds(view);
        this.height = this.view.height;
        this.width = this.view.width;
    }

    update() {
        this.updateBounds(this.view);
    }
}

export = RigidBody;


