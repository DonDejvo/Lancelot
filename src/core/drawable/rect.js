import { FixedDrawable } from "./drawable.js";

export class Rect extends FixedDrawable {
    constructor(params) {
        super(params);
    }
    Draw(ctx) {
        ctx.beginPath();
        ctx.rect(-this._width / 2, -this._height / 2, this._width, this._height);
        ctx.fill();
        if(this.strokeWidth > 0) ctx.stroke();
        if(this._imageOptions) this.DrawImage(ctx, this._width, this._height);
    }
}