import { FixedDrawable } from "./Drawable.js";

export class Picture extends FixedDrawable {
    constructor(params) {
        super(params);
    }

    draw(ctx) {
        ctx.globalAlpha = this.opacity;
        this.drawImage(ctx, {
            clip: false,
            width: this._width,
            height: this._height
        });
    }
    
    drawShadow(ctx) {
        ctx.fillStyle = this.shadowColor.value;
        ctx.beginPath();
        ctx.rect(-this._width / 2, -this._height / 2, this._width, this._height);
        ctx.fill();
    }
    
}