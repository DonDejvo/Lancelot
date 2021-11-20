import { Drawable } from "./Drawable.js";

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
        this._fillColor.fill(ctx);
        this._strokeColor.stroke(ctx);
        ctx.beginPath();
        for(let i = 0; i <= this._points.length; ++i) {
            const v = this._points[i % this._points.length];
            if(i == 0) {
                const len = v.length;
                ctx.moveTo(v[len - 2], v[len - 1]);
            }
            else {
                if(v.length == 6) {
                    ctx.bezierCurveTo(...v);
                } else if(v.length == 4) {
                    ctx.quadraticCurveTo(...v);
                } else {
                    ctx.lineTo(...v);
                }
            }
        }
        ctx.closePath();
        ctx.fill();
        if(this._strokeWidth != 0) {
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
        for(let i = 0; i <= this._points.length; ++i) {
            const v = this._points[i % this._points.length];
            if(i == 0) {
                const len = v.length;
                ctx.moveTo(v[len - 2], v[len - 1]);
            }
            else {
                if(v.length == 6) {
                    ctx.bezierCurveTo(...v);
                } else if(v.length == 4) {
                    ctx.quadraticCurveTo(...v);
                } else {
                    ctx.lineTo(...v);
                }
            }
        }
        ctx.closePath();
        if(this.fillColor != "transparent") {
            ctx.fill();
        }
        if(this.strokeWidth != 0) {
            ctx.stroke();
        }
    }
}