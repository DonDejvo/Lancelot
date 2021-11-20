import { Component } from "../core/Component.js";
import { Animator } from "../utils/Animator.js";
import { Color } from "../utils/Color.js";
import { paramParser } from "../utils/ParamParser.js";

export class Light extends Component {

    _color;
    _scale;

    constructor(params) {
        super();
        this._type = "light";
        this._color = new Color(params.color);
        this._scale = new Animator(paramParser.parseValue(params.scale, 1));
    }

    get color() {
        return this._color._color;
    }

    set color(col) {
        this._color.set(col);
    }

    get scale() {
        return this._scale.value;
    }

    set scale(val) {
        this._scale.value = val;
    }

    scaleTo(val, dur, timing = "linear", onEnd = null) {
        this._scale.animate(val, dur, timing, onEnd);
    }

    initComponent() {
        this.scene.addLight(this);
    }

    drawInternal(ctx) {
        ctx.save();
        ctx.translate(this.position.x, this.position.y);
        ctx.scale(this.scale, this.scale);
        ctx.rotate(this.angle);
        this.draw(ctx);
        ctx.restore();
    }

    draw(_) {}

    update(elapsedTimeS) {
        this._scale.update(elapsedTimeS);
        this._angle.update(elapsedTimeS);
    }
}