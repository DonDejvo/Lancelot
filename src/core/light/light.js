import { Component } from "../component.js";
import { ParamParser } from "../utils/param-parser.js";
import { StyleParser } from "../utils/style-parser.js";

class Light extends Component {
    constructor(params) {
        super();
        this._type = "light";
        this._color = ParamParser.ParseValue(params.color, "white");
        this._colorParsed = null;
    }
    get color() {
        return this._color;
    }
    set color(col) {
        this._color = col;
        this._colorParsed = null;
    }
    Draw0(ctx) {
        if(!this._colorParsed) {
            this._colorParsed = StyleParser.ParseColor(ctx, this.color);
        }
        ctx.save();
        ctx.fillStyle = this._colorParsed;
        this.Draw(ctx);
        ctx.restore();
    }
    Draw(_) {}
}

export class AmbientLight extends Light {
    constructor(params) {
        super(params);
    }
    Draw(ctx) {
        ctx.beginPath();
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    }
}

export class RadialLight extends Light {
    constructor(params) {
        super(params);
        this.radius = ParamParser.ParseValue(params.radius, 100);
        this.angle = 0;
        this.angleRange = ParamParser.ParseValue(params.angleRange, Math.PI * 2);
    }
    Draw(ctx) {
        ctx.beginPath();
        ctx.translate(this.position.x, this.position.y);
        ctx.rotate(this.angle);
        ctx.arc(0, 0, this.radius, -this.angleRange/2, this.angleRange/2);
        ctx.lineTo(0, 0);
        ctx.closePath();
        ctx.fill();
    }
}