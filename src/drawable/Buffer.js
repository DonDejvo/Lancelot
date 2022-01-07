import { Drawable } from "./Drawable.js";

export class Buffer extends Drawable {

    _buffer = document.createElement("canvas").getContext("2d");;

    constructor(params) {
        super(params);
        this._bounds = params.bounds;
        this._initBuffer();
    }

    _initBuffer() {
        this._buffer.canvas.width = this._bounds[1][0] - this._bounds[0][0];
        this._buffer.canvas.height = this._bounds[1][1] - this._bounds[0][1];
    }

    add(elem) {
        const ctx = this._buffer;
        ctx.save();
        ctx.translate(-this._bounds[0][0], -this._bounds[0][1]);
        elem.drawInternal(ctx);
        ctx.restore();
    }

    clear() {
        const ctx = this._buffer;
        ctx.beginPath();
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    }

    getBoundingBox() {
        
        const w = this._bounds[1][0] - this._bounds[0][0],
        h = this._bounds[1][1] - this._bounds[0][1];

        return {
            width: w,
            height: h,
            x: this._bounds[0][0] + w / 2,
            y: this._bounds[0][1] + h / 2
        }
    }

    draw(ctx) {
        ctx.globalAlpha = this.opacity;
        ctx.beginPath();
        ctx.drawImage(this._buffer.canvas, this._bounds[0][0], this._bounds[0][1]);
    }
    
}