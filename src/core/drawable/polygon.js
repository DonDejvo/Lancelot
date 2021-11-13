import { FixedDrawable } from "./drawable.js";
import { ParamParser } from "../utils/param-parser.js";

export class Poly extends FixedDrawable {
    constructor(params) {
        super(params);
        this._points = ParamParser.ParseValue(params.points, []);
    }
    get boundingBox() {
        const verts = this._points;

        let maxDist = 0;
        let idx = 0;
        for(let i = 0; i < verts.length; ++i) {
            const v = verts[i];
            const dist = Math.hypot(v[0], v[1]);
            if(dist > maxDist) {
                maxDist = dist;
                idx = i;
            }
        }
        const d = maxDist * 2;
        return {
            width: d,
            height: d,
            x: this.position.x,
            y: this.position.y
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

export class Polygon extends Poly {
    constructor(params) {
        super(params);
        this._radius = params.radius;
        this.sides = params.sides;

        this._InitPoints();
    }
    _InitPoints() {
        const points = [];
        for(let i = 0; i < this.sides; ++i) {
            const angle = Math.PI * 2 / this.sides * i;
            points.push([Math.cos(angle) * this.radius, Math.sin(angle) * this.radius]);
        }
        this._points = points;
    }
    get radius() {
        return this._radius;
    }
    set radius(num) {
        this._radius = num;
    }
    get boundingBox() {
        return { 
            width: this._radius * 2,
            height: this._radius * 2,
            x: this.position.x,
            y: this.position.y
        };
    }
    Draw(ctx) {
        super.Draw(ctx);
        if(this._imageOptions) this.DrawImage(ctx, this.radius * 2, this.radius * 2);
    }
}
