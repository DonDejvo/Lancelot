import { Component } from "../component.js";
import { ParamParser } from "../utils/param-parser.js";
import { StyleParser } from "../utils/style-parser.js";

export class AmbientLight {
    constructor(params) {
        this.color = ParamParser.ParseValue(params.color, "white");
    }
    Draw(ctx) {
        ctx.beginPath();
        ctx.fillStyle = StyleParser.ParseStyle(ctx, this.color);
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    }
}

export class RadialLight extends Component {
    constructor(params) {
        super();
        this._type = "light";
        this.color = ParamParser.ParseValue(params.color, "white");
        this.radius = ParamParser.ParseValue(params.radius, 100);
        this.angle = 0;
        this.angleRange = ParamParser.ParseValue(params.angleRange, Math.PI * 2);
    }
    Draw(ctx) {
        ctx.beginPath();
        ctx.save();
        ctx.translate(this.position.x, this.position.y);
        ctx.rotate(this.angle);
        ctx.fillStyle = StyleParser.ParseStyle(ctx, this.color);
        ctx.arc(0, 0, this.radius, -this.angleRange/2, this.angleRange/2);
        ctx.lineTo(0, 0);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }
}