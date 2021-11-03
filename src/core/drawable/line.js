import { FixedDrawable } from "./drawable.js";
import { Vector } from "../utils/vector.js";

export class Line extends FixedDrawable {
    constructor(params) {
        super(params);
        this.length = params.length;
    }
    get boundingBox() {
        const center = Vector.FromAngle(this.angle).Mult(this.length / 2);
        return { 
            width: this.length,
            height: this.length,
            x: center.x,
            y: center.y
        };
    }
    Draw(ctx) {
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(this.length, 0);
        ctx.stroke();
    }
}