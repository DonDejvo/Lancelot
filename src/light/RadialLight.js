import { Light } from "./Light.js";
import { math } from "../utils/Math.js";
import { paramParser } from "../utils/ParamParser.js";

export class RadialLight extends Light {

    _radius;
    _angleRange;

    constructor(params) {
        super(params);
        this._radius = params.radius;
        this._angleRange = paramParser.parseValue(params.angleRange, Math.PI * 2);
    }

    get radius() {
        return this._radius;
    }

    set radius(val) {
        this._radius = Math.max(val, 0);
    }

    get angleRange() {
        return this._angleRange;
    }

    set angleRange(val) {
        this._angleRange = math.clamp(val, 0, Math.PI * 2);
    }

    draw(ctx) {
        this._color.fill(ctx);
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, -this.angleRange/2, this.angleRange/2);
        ctx.lineTo(0, 0);
        ctx.closePath();
        ctx.fill();
    }
}