import { FixedDrawable } from "./Drawable.js";

export class Circle extends FixedDrawable {

    _radius;

    constructor(params) {
        super(params);
        this._radius = params.radius;
    }

    get radius() {
        return this._radius;
    }

    set radius(val) {
        this._radius = val;
    }

    getBoundingBox() {
        return { 
            width: this._radius * 2 * Math.abs(this.scale.x),
            height: this._radius * 2 * Math.abs(this.scale.y),
            x: this.position.x - this._center.x * Math.abs(this.scale.x),
            y: this.position.y - this._center.y * Math.abs(this.scale.y)
        };
    }
    
    draw(ctx) {
        ctx.globalAlpha = this.opacity;
        ctx.lineWidth = this.strokeWidth;
        ctx.lineCap = this.strokeCap;
        this._fillColor.fill(ctx);
        this._strokeColor.stroke(ctx);
        ctx.beginPath();
        ctx.arc(0, 0, this._radius, 0, 2 * Math.PI);
        ctx.fill();
        if(this.strokeWidth != 0) {
            ctx.stroke();
        }
        if(this._image) {
            this.drawImage(ctx);
        }
    }

    drawShadow(ctx) {
        ctx.lineWidth = this.strokeWidth;
        ctx.lineCap = this.strokeCap;
        this._shadowColor.fill(ctx);
        this._shadowColor.stroke(ctx);
        ctx.beginPath();
        ctx.arc(0, 0, this._radius, 0, 2 * Math.PI);
        if(this.fillColor != "transparent") {
            ctx.fill();
        }
        if(this.strokeWidth != 0) {
            ctx.stroke();
        }
    }
}