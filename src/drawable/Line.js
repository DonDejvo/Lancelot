import { FixedDrawable } from "./Drawable.js";
import { Vector } from "../utils/Vector.js";

export class Line extends FixedDrawable {

    _length;

    constructor(params) {
        super(params);
        this._length = params.length;
    }

    get length() {
        return this._length;
    }

    set length(val) {
        this._length = Math.max(val, 0);
    }

    getGoundingBox() {
        const center = Vector.fromAngle(this._angle).mult(this._length / 2);
        return { 
            width: this._length * Math.abs(this.scale.x),
            height: this._length * Math.abs(this.scale.y),
            x: center.x,
            y: center.y
        };
    }

    draw(ctx) {
        ctx.globalAlpha = this.opacity;
        ctx.lineWidth = this.strokeWidth;
        ctx.lineCap = this.strokeCap;
        ctx.strokeStyle = this.strokeColor.value;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(this._length, 0);
        ctx.stroke();
    }
    
    drawShadow(ctx) {
        ctx.lineWidth = this.strokeWidth;
        ctx.lineCap = this.strokeCap;
        ctx.strokeStyle = this.shadowColor.value;
        ctx.globalAlpha = this._strokeColor.alpha;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(this._length, 0);
        ctx.stroke();
    }
    
}