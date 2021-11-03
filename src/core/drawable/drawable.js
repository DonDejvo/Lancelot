import { Component } from "../component.js";
import { Vector } from "../utils/vector.js";
import { ParamParser } from "../utils/param-parser.js";
import { StyleParser } from "../utils/style-parser.js";

export class Drawable extends Component {
    constructor(params = {}) {
        super();
        this._type = "drawable";
        this._width = ParamParser.ParseValue(params.width, 0);
        this._height = ParamParser.ParseValue(params.height, 0);
        this._zIndex = ParamParser.ParseValue(params.zIndex, 0);
        this.opacity = ParamParser.ParseValue(params.opacity, 1);
        this._angle = 0;
        this._fillStyle = ParamParser.ParseValue(params.fillStyle, "black");
        this._strokeStyle = ParamParser.ParseValue(params.strokeStyle, "black");
        this.strokeWidth = ParamParser.ParseValue(params.strokeWidth, 0);
        this.mode = ParamParser.ParseValue(params.mode, "source-over");
    }
    get zIndex() {
        return this._zIndex;
    }
    set zIndex(val) {
        this._zIndex = val;
        if(this.scene) {
            this.scene._RemoveDrawable(this);
            this.scene._AddDrawable(this);
        }
    }
    get width() {
        return this._width;
    }
    get height() {
        return this._height;
    }
    set width(num) {
        this._width = num;
    }
    set height(num) {
        this._height = num;
    }
    set angle(num) {
        this._angle = num;
    }
    get angle() {
        return this._angle;
    }
    get scale() {
        return this._scale;
    }
    set scale(num) {
        this._scale = num;
    }
    get fillStyle() {
        return this._fillStyle;
    }
    set fillStyle(col) {
        this._fillStyle = col;
    }
    get strokeStyle() {
        return this._strokeStyle;
    }
    set strokeStyle(col) {
        this._strokeStyle = col;
    }
    get boundingBox() {
        const d = Math.hypot(this._width, this._height) / 2;
        return {
            width: d,
            height: d,
            x: this.position.x,
            y: this.position.y
        }
    }
    get boundingBox() {
        return {
            width: this._width,
            height: this._height,
            x: this.position.x,
            y: this.position.y
        }
    }
    Draw(_) {}
    Draw0(ctx) {
        ctx.save();
        ctx.globalCompositeOperation = this.mode;
        ctx.globalAlpha = this.opacity;
        ctx.fillStyle = StyleParser.ParseColor(ctx, this.fillStyle);
        ctx.strokeStyle = StyleParser.ParseColor(ctx, this.strokeStyle);
        ctx.lineWidth = this.strokeWidth;
        this.Draw(ctx);
        ctx.restore();
    }
}

export class FixedDrawable extends Drawable {
    constructor(params) {
        super(params);
        this._offset = new Vector();
        this._shaking = null;
        this.flip = ParamParser.ParseObject(params.flip, { x: false, y: false });
        this._scale = ParamParser.ParseObject(params.scale, { x: 1, y: 1 });
        this._image = null;
        this._imageOptions = params.image;
    }
    InitComponent() {
        if(this._imageOptions) {
            this._image = this.scene.resources.get(this._imageOptions.src);
            this._imageOptions = ParamParser.ParseObject(this._imageOptions, {
                frameWidth: this._image.width,
                frameHeight: this._image.height,
                framePosition: { x: 0, y: 0 }
            });
        }
    }
    Shake(range, dur, freq, angle) {
        this._shaking = {
            counter: 0,
            freq: freq,
            angle: angle,
            dur: dur,
            range: range
        };
    }
    StopShaking() {
        this._shaking = null;
        this._offset = new Vector();
    }
    Draw0(ctx) {
        ctx.save();
        ctx.translate(-this._offset.x, - this._offset.y);
        ctx.save();
        ctx.globalCompositeOperation = this.mode;
        ctx.globalAlpha = this.opacity;
        ctx.translate(this.position.x, this.position.y);
        ctx.scale(this.flip.x ? -this.scale: this.scale, this.flip.y ? -this.scale : this.scale);
        ctx.rotate(this.angle);
        ctx.fillStyle = StyleParser.ParseColor(ctx, this.fillStyle);
        ctx.strokeStyle = StyleParser.ParseColor(ctx, this.strokeStyle);
        ctx.lineWidth = this.strokeWidth;
        this.Draw(ctx);
        ctx.restore();
        ctx.restore();
    }
    Update(elapsedTimeS) {
        if(this._shaking) {
            const anim = this._shaking;
            const count = Math.floor(anim.freq / 1000 * anim.dur);
            anim.counter += elapsedTimeS * 1000;
            const progress = Math.min(anim.counter / anim.dur, 1);
            this._offset.Copy(new Vector(Math.sin(progress * Math.PI * 2 * count) * anim.range, 0).Rotate(anim.angle));
            if (progress == 1) {
                this.StopShaking();
            }
        }
    }
}