import { FixedDrawable } from "./Drawable.js";
import { paramParser } from "../utils/ParamParser.js";

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

export class RegularPolygon extends Polygon {

    _radius;
    _sides;

    constructor(params) {
        super(params);
        this._radius = params.radius;
        this._sides = params.sides;

        this._initPoints();
    }

    get radius() {
        return this._radius;
    }

    set radius(val) {
        this._radius = Math.max(val, 0);
        this._initPoints();
    }

    get sides() {
        return this._sides;
    }

    set sides(val) {
        this._sides = Math.max(val, 3);
        this._initPoints();
    }

    _initPoints() {
        const points = [];
        for(let i = 0; i < this.sides; ++i) {
            const angle = Math.PI * 2 / this.sides * i;
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
