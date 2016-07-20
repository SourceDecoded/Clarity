class Sprite {
    name: string;
    source: string;
    offset: {
        x: number
        ;
        y: number;
    };
    positionOnSource: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
    vertices: {
        x: number;
        y: number;
    }[];
    force: {
        x: number;
        y: number;
    };
    velocity: {
        x: number;
        y: number;
    };
    angle: number;
    angleVelocity: number;
    constructor() {
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
}

export = Sprite;