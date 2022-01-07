import { FixedDrawable } from "./Drawable.js";
import { fillRing, strokeRing } from "./Primitives.js";

export class Ring extends FixedDrawable {

    _innerRadius;
    _outerRadius;

    constructor(params) {
        super(params);
        this._innerRadius = params.innerRadius;
        this._outerRadius = params.outerRadius;
    }

    get innerRadius() {
        return this._innerRadius;
    }

    set innerRadius(val) {
        this._innerRadius = Math.max(val, 0);
    }

    get outerRadius() {
        return this._innerRadius;
    }

    set outerRadius(val) {
        this._outerRadius = Math.max(val, this._innerRadius);
    }
    
    getBoundingBox() {
        return { 
            width: this._outerRadius * 2 * Math.abs(this.scale.x),
            height: this._outerRadius * 2 * Math.abs(this.scale.y),
            x: this.position.x - this._center.x * Math.abs(this.scale.x),
            y: this.position.y - this._center.y * Math.abs(this.scale.y)
        };
    }

    draw(ctx) {
        ctx.globalAlpha = this.opacity;
        ctx.lineWidth = this.strokeWidth;
        ctx.lineCap = this.strokeCap;
        ctx.fillStyle = this.fillColor.value;
        ctx.strokeStyle = this.strokeColor.value;
        fillRing(ctx, 0, 0, this._innerRadius, this._outerRadius);
        if(this.strokeWidth != 0) {
            strokeRing(ctx, 0, 0, this._innerRadius, this._outerRadius);
        }
    }

    drawShadow(ctx) {
        ctx.lineWidth = this.strokeWidth;
        ctx.lineCap = this.strokeCap;
        ctx.fillStyle = this.shadowColor.value;
        ctx.strokeStyle = this.shadowColor.value;
        if(this.fillColor != "transparent") {
            ctx.globalAlpha = this._fillColor.alpha;
            fillRing(ctx, 0, 0, this._innerRadius, this._outerRadius);
        }
        if(this.strokeWidth != 0) {
            ctx.globalAlpha = this._strokeColor.alpha;
            strokeRing(ctx, 0, 0, this._innerRadius, this._outerRadius);
        }
    }

}