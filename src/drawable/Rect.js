import { FixedDrawable } from "./Drawable.js";

export class Rect extends FixedDrawable {
    constructor(params) {
        super(params);
    }

    draw(ctx) {
        ctx.globalAlpha = this.opacity;
        ctx.lineWidth = this.strokeWidth;
        ctx.lineCap = this.strokeCap;
        this._fillColor.fill(ctx);
        this._strokeColor.stroke(ctx);
        ctx.beginPath();
        ctx.rect(-this._width / 2, -this._height / 2, this._width, this._height);
        ctx.fill();
        if(this._strokeWidth != 0) {
            ctx.stroke();
        }
        this.drawImage(ctx);
    }
    
    drawShadow(ctx) {
        ctx.lineWidth = this.strokeWidth;
        ctx.lineCap = this.strokeCap;
        this._shadowColor.fill(ctx);
        this._shadowColor.stroke(ctx);
        if(this.fillColor != "transparent") {
            ctx.globalAlpha = this._fillColor.alpha;
            ctx.fillRect(-this._width / 2, -this._height / 2, this._width, this._height);
        }
        if(this.strokeWidth != 0) {
            ctx.globalAlpha = this._strokeColor.alpha;
            ctx.strokeRect(-this._width / 2, -this._height / 2, this._width, this._height);
        }
    }
    
}