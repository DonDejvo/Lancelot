import { FixedDrawable } from "./Drawable.js";
import { paramParser } from "../utils/ParamParser.js";
import { polygon } from "./Primitives.js";

export class Polygon extends FixedDrawable {

    _points;

    constructor(params) {
        super(params);
        this._points = paramParser.parseValue(params.points, []);
    }

    getBoundingBox() {
        const verts = this._points;

        let maxDist = 0;
        let idx = 0;
        for(let i = 0; i < verts.length; ++i) {
            const v = verts[i];
            const len = v.length;
            const dist = Math.hypot(v[len - 2], v[len -1]);
            if(dist > maxDist) {
                maxDist = dist;
                idx = i;
            }
        }
        const d = maxDist * 2;
        return {
            width: d * Math.abs(this.scale.x),
            height: d * Math.abs(this.scale.y),
            x: this.position.x - this._center.x * Math.abs(this.scale.x),
            y: this.position.y - this._center.y * Math.abs(this.scale.y)
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
        this.drawImage(ctx);
    }
    
    drawShadow(ctx) {
        ctx.lineWidth = this.strokeWidth;
        ctx.lineCap = this.strokeCap;
        ctx.fillStyle = this.shadowColor.value;
        ctx.strokeStyle = this.shadowColor.value;
        
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

export class RegularPolygon extends Polygon {

    _radius;
    _edges;

    constructor(params) {
        super(params);
        this._radius = params.radius;
        this._edges = params.edges;

        this._initPoints();
    }

    get radius() {
        return this._radius;
    }

    set radius(val) {
        this._radius = Math.max(val, 0);
        this._initPoints();
    }

    get edges() {
        return this._edges;
    }

    set edges(val) {
        this._edges = Math.max(val, 3);
        this._initPoints();
    }

    _initPoints() {
        const points = [];
        for(let i = 0; i < this.edges; ++i) {
            const angle = 2 * Math.PI * (i / this.edges - 0.25);
            points.push([Math.cos(angle) * this.radius, Math.sin(angle) * this.radius]);
        }
        this._points = points;
    }
    
    getBoundingBox() {
        return { 
            width: this._radius * 2 * Math.abs(this.scale.x),
            height: this._radius * 2 * Math.abs(this.scale.y),
            x: this.position.x - this._center.x * Math.abs(this.scale.x),
            y: this.position.y - this._center.y * Math.abs(this.scale.y)
        };
    }

}

export class Star extends Polygon {

    _innerRadius;
    _outerRadius;
    _peaks;

    constructor(params) {
        super(params);
        this._innerRadius = params.innerRadius;
        this._outerRadius = params.outerRadius;
        this._peaks = params.peaks;

        this._initPoints();
    }

    get innerRadius() {
        return this._innerRadius;
    }

    set innerRadius(val) {
        this._innerRadius = Math.max(val, 0);
        this._initPoints();
    }

    get outerRadius() {
        return this._innerRadius;
    }

    set outerRadius(val) {
        this._outerRadius = Math.max(val, 0);
        this._initPoints();
    }

    get peaks() {
        return this._peaks;
    }

    set peaks(val) {
        this._peaks = Math.max(val, 3);
        this._initPoints();
    }

    _initPoints() {
        const count = this._peaks * 2;
        const points = [];
        for(let i = 0; i < count; ++i) {
            const angle = 2 * Math.PI * (i / count - 0.25);
            const d = i % 2 ? this._innerRadius : this._outerRadius;
            points.push([Math.cos(angle) * d, Math.sin(angle) * d]);
        }
        this._points = points;
    }
    
    getBoundingBox() {
        return { 
            width: this._outerRadius * 2 * Math.abs(this.scale.x),
            height: this._outerRadius * 2 * Math.abs(this.scale.y),
            x: this.position.x - this._center.x * Math.abs(this.scale.x),
            y: this.position.y - this._center.y * Math.abs(this.scale.y)
        };
    }

}

export class RoundedRect extends Polygon {
    
    _borderRadius;
    
    constructor(params) {
        super(params);
        this._borderRadius = params.borderRadius;

        this._initPoints();
    }

    get width() {
        return this._width;
    }

    set width(val) {
        this._width = val;
        this._initPoints();
    }

    get height() {
        return this._height;
    }

    set height(val) {
        this._height = val;
        this._initPoints();
    }

    get borderRadius() {
        return this._borderRadius;
    }

    set borderRadius(val) {
        this._borderRadius = val;
        this._initPoints();
    }

    _initPoints() {
        const w = this._width;
        const h = this._height;
        const r = this._borderRadius;
        this._points = [
            [-w/2, -(h/2-r)],
            [-w/2, -h/2, -(w/2-r), -h/2],
            [w/2-r, -h/2],
            [w/2, -h/2, w/2, -(h/2-r)],
            [w/2, h/2-r],
            [w/2, h/2, w/2-r, h/2],
            [-(w/2-r), h/2],
            [-w/2, h/2, -w/2, h/2-r]
        ];
    }
}
