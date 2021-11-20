import { FixedDrawable } from "./Drawable.js";

export class Picture extends FixedDrawable {
    constructor(params) {
        super(params);
    }

    draw(ctx) {
        ctx.globalAlpha = this.opacity;
        this.drawImage(ctx, this._width, this._height, false);
    }

    drawShadow(ctx) {
        this._shadowColor.fill(ctx);
        ctx.beginPath();
        ctx.rect(-this._width / 2, -this._height / 2, this._width, this._height);
        ctx.fill();
    }
}