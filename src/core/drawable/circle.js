import { FixedDrawable } from "./drawable.js";

export class Circle extends FixedDrawable {
    constructor(params) {
        super(params);
        this._radius = params.radius;
    }
    get radius() {
        return this._radius;
    }
    get boundingBox() {
        return { 
            width: this._radius * 2,
            height: this._radius * 2,
            x: this.position.x,
            y: this.position.y
        };
    }
    set radius(val) {
        this._radius = val;
    }
    Draw(ctx) {
        ctx.beginPath();
        ctx.arc(0, 0, this._radius, 0, 2 * Math.PI);
        ctx.fill();
        if(this.strokeWidth > 0) ctx.stroke();
        if(this._imageOptions) this.DrawImage(ctx, this._radius * 2, this._radius * 2);
    }
}