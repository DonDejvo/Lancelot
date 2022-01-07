import { Drawable } from "./Drawable.js";
import { polygon } from "./Primitives.js";

export class Path extends Drawable {

    _points;

    constructor(params) {
        super(params);
        this._points = params.points;
    }

    getBoundingBox() {
        const verts = this._points;

        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity; 
        for(let i = 0; i < verts.length; ++i) {
            const v = verts[i];
            const len = v.length;
            const x = v[len - 2], y = v[len - 1];
            if(x < minX) {
                minX = x;
            }  else if(x > maxX) {
                maxX = x;
            }
            if(y < minY) {
                minY = y;
            } else if(y > maxY) {
                maxY = y;
            }
        }
        return {
            width: Math.abs(maxX - minX),
            height: Math.abs(maxY - minY),
            x: (maxX + minX) / 2,
            y: (maxY + minY) / 2
        }
    }

    draw(ctx) {
        ctx.globalAlpha = this.opacity;
        ctx.lineWidth = this.strokeWidth;
        ctx.lineCap = this.strokeCap;
        ctx.fillStyle = this.fillColor.value;
        ctx.strokeStyle = this.strokeColor.value;
        ctx.beginPath();
        polygon(ctx, ...this._points);
        ctx.closePath();
        ctx.fill();
        if(this._strokeWidth != 0) {
            ctx.stroke();
        }
    }
    
    drawShadow(ctx) {
        ctx.lineWidth = this.strokeWidth;
        ctx.lineCap = this.strokeCap;
        this._shadowColor.fill(ctx);
        this._shadowColor.stroke(ctx);
        if(this.fillColor != "transparent") {
            ctx.globalAlpha = this._fillColor.alpha;
            ctx.beginPath();
            polygon(ctx, ...this._points);
            ctx.closePath();
            ctx.fill();
        }
        if(this.strokeWidth != 0) {
            ctx.globalAlpha = this._strokeColor.alpha;
            ctx.beginPath();
            polygon(ctx, ...this._points);
            ctx.closePath();
            ctx.stroke();
        }
    }
    
}