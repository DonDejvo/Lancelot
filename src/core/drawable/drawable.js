import { Component } from "../component.js";
import { Vector } from "../utils/vector.js";
import { ParamParser } from "../utils/param-parser.js";
import { StyleParser } from "../utils/style-parser.js";

export class Drawable extends Component {
    constructor(params = {}) {
        super();
        this._type = "drawable";
        this._zIndex = ParamParser.ParseValue(params.zIndex, 0);
        this.opacity = ParamParser.ParseValue(params.opacity, 1);
        this._fillStyle = ParamParser.ParseValue(params.fillStyle, "black");
        this._strokeStyle = ParamParser.ParseValue(params.strokeStyle, "black");
        this.strokeWidth = ParamParser.ParseValue(params.strokeWidth, 0);
        this.mode = ParamParser.ParseValue(params.mode, "source-over");
        this._fillStyleParsed = null;
        this._strokeStyleParsed = null;
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
    get fillStyle() {
        return this._fillStyle;
    }
    set fillStyle(col) {
        this._fillStyle = col;
        this._fillStyleParsed = null;
    }
    get strokeStyle() {
        return this._strokeStyle;
    }
    set strokeStyle(col) {
        this._strokeStyle = col;
        this._strokeStyleParsed = null;
    }
    get boundingBox() {
        return {
            x: 0,
            y: 0,
            width: 0,
            height: 0
        };
    }
    Draw(_) {}
    Draw0(ctx) {
        this.ParseStyles(ctx);
        ctx.save();
        ctx.globalCompositeOperation = this.mode;
        ctx.globalAlpha = this.opacity;
        ctx.fillStyle = this._fillStyleParsed;
        ctx.strokeStyle = this._strokeStyleParsed;
        ctx.lineWidth = this.strokeWidth;
        this.Draw(ctx);
        ctx.restore();
    }
    ParseStyles(ctx) {
        if(!this._fillStyleParsed) {
            this._fillStyleParsed = StyleParser.ParseColor(ctx, this.fillStyle);
        }
        if(!this._strokeStyleParsed) {
            this._strokeStyleParsed = StyleParser.ParseColor(ctx, this.strokeStyle);
        }
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
        this.center = new Vector();
        this._width = ParamParser.ParseValue(params.width, 0);
        this._height = ParamParser.ParseValue(params.height, 0);
        this._angle = 0;
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
    get boundingBox() {
        const d = Math.hypot(this._width, this._height);
        return {
            width: d * this.scale.x,
            height: d * this.scale.y,
            x: this.position.x,
            y: this.position.y
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
        this.ParseStyles(ctx);
        ctx.save();
        ctx.translate(-this._offset.x, - this._offset.y);
        ctx.globalCompositeOperation = this.mode;
        ctx.globalAlpha = this.opacity;
        ctx.translate(this.position.x, this.position.y);
        ctx.scale(this.flip.x ? -this.scale.x: this.scale.x, this.flip.y ? -this.scale.y : this.scale.y);
        ctx.rotate(this.angle);
        ctx.translate(this.center.x, this.center.y);
        ctx.fillStyle = this._fillStyleParsed;
        ctx.strokeStyle = this._strokeStyleParsed;
        ctx.lineWidth = this.strokeWidth;
        this.Draw(ctx);
        ctx.restore();
    }
    DrawImage(ctx, w, h, clip = true, framePos = this._imageOptions.framePosition) {
        if(clip) {
            ctx.clip();
        }
        ctx.drawImage(this._image, framePos.x * this._imageOptions.frameWidth, framePos.y * this._imageOptions.frameHeight, this._imageOptions.frameWidth, this._imageOptions.frameHeight, -w / 2, -h / 2, w, h);
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
    FollowBody() {
        let body = this.parent.body;
        if(!body) {
            return;
        }
        this.parent.AddComponent(new BodyFollower({
            target: this
        }));
    }
    SetSize(w, h) {
        this.width = w;
        this.height = h;
    }
}

class BodyFollower extends Component {
    constructor(params) {
        super();
        this._target = params.target;
    }
    Update(dt) {
        const body = this.parent.body;

        this._target.angle = body.angle;
        this._target.offset = body.offset;
    }
}