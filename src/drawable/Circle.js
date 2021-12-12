import { paramParser } from "../utils/ParamParser.js";
import { FixedDrawable } from "./Drawable.js";

export class Circle extends FixedDrawable {

    _radius;

    constructor(params) {
        super(params);
        this._radius = params.radius;
        this._angleRange = paramParser.parseValue(params.angleRange, 2 * Math.PI);
        this._centered = paramParser.parseValue(params.centered, false);
    }

    get radius() {
        return this._radius;
    }

    set radius(val) {
        this._radius = val;
    }

    get angleRange() {
        return this._angleRange;
    }

    set angleRange(val) {
        this._angleRange = val;
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
        ctx.arc(0, 0, this._radius, -this.angleRange/2, this.angleRange/2);
        if(this._centered) {
            ctx.lineTo(0, 0);
        }
        ctx.closePath();
        ctx.fill();
        if(this.strokeWidth != 0) {
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
            ctx.beginPath();
            ctx.arc(0, 0, this._radius, -this.angleRange/2, this.angleRange/2);
            if(this._centered) {
                ctx.lineTo(0, 0);
            }
            ctx.closePath();
            ctx.fill();
        }
        if(this.strokeWidth != 0) {
            ctx.globalAlpha = this._strokeColor.alpha;
            ctx.beginPath();
            ctx.arc(0, 0, this._radius, -this.angleRange/2, this.angleRange/2);
            if(this._centered) {
                ctx.lineTo(0, 0);
            }
            ctx.closePath();
            ctx.stroke();
        }
    }
    
}