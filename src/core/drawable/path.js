import { Drawable } from "./drawable.js";

export class Path extends Drawable {
    constructor(params) {
        super(params);
        this._points = params.points;
    }
    get boundingBox() {
        const verts = this._points;

        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity; 
        for(let i = 0; i < verts.length; ++i) {
            const v = verts[i];
            if(v[0] < minX) {
                minX = v[0];
            }  else if(v[0] > maxX) {
                maxX = v[0];
            }
            if(v[1] < minY) {
                minY = v[1];
            } else if(v[1] > maxY) {
                maxY = v[1];
            }
        }
        return {
            width: Math.abs(maxX - minX),
            height: Math.abs(maxY - minY),
            x: (maxX + minX) / 2,
            y: (maxY + minY) / 2
        }
    }
    Draw(ctx) {
        ctx.beginPath();
        for(let i = 0; i < this._points.length; ++i) {
            const v = this._points[i];
            if(i == 0) ctx.moveTo(...v);
            else ctx.lineTo(...v);
        }
        ctx.closePath();
        ctx.fill();
        if(this.strokeWidth > 0) ctx.stroke();
    }
}