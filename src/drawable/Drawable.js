import { Color } from "../utils/Color.js";
import { math } from "../utils/Math.js";
import { paramParser } from "../utils/ParamParser.js";
import { Component } from "../core/Component.js";
import { Vector } from "../utils/Vector.js";
import { Animator } from "../utils/Animator.js";
import { Shaker } from "../utils/Shaker.js";

export class Drawable extends Component {

    _zIndex;
    _opacity;
    _fillColor;
    _strokeColor;
    _strokeWidth;
    _visible = true;

    /**
     * 
     * @param {Object} params
     * @param {number} params.zIndex
     * @param {number} params.opacity
     * @param {string} params.fillColor
     * @param {string} params.strokeColor
     * @param {number} params.strokeWidth
     * @param {string} params.strokeCap
     * @param {string} params.shadowColor
     * @param {Object} params.shadow
     */

    constructor(params = {}) {
        super();
        this._type = "drawable";
        this._zIndex = paramParser.parseValue(params.zIndex, 0);
        this._opacity = new Animator(paramParser.parseValue(params.opacity, 1.0));
        this._fillColor = new Color(paramParser.parseValue(params.fillColor, "white"));
        this._strokeColor = new Color(params.strokeColor);
        this._strokeWidth = paramParser.parseValue(params.strokeWidth, 1.0);
        this._strokeCap = paramParser.parseValue(params.strokeCap, "butt");
        this._shadowColor = new Color(paramParser.parseValue(params.shadowColor, "transparent"));
        this._shadow = paramParser.parseObject(params.shadow, {
            x: 0,
            y: 0
        });
    }

    get visible() {
        return this._visible;
    }

    set visible(val) {
        this._visible = val;
    }

    get zIndex() {
        return this._zIndex;
    }

    set zIndex(val) {
        this._zIndex = val;
        if(this.scene) {
            this.scene.removeDrawable(this);
            this.scene.addDrawable(this);
        }
    }

    get opacity() {
        return this._opacity.value;
    }

    set opacity(val) {
        this._opacity.value = math.sat(val);
    }

    get strokeWidth() {
        return this._strokeWidth;
    }

    set strokeWidth(val) {
        this._strokeWidth = Math.max(val, 0);
    }

    get fillColor() {
        return this._fillColor._color;
    }

    set fillColor(col) {
        this._fillColor.set(col);
    }

    get shadowColor() {
        return this._shadowColor._color;
    }

    set shadowColor(col) {
        this._shadowColor.set(col);
    }

    get shadow() {
        return this._shadow;
    }

    get strokeColor() {
        return this._strokeColor._color;
    }

    set strokeColor(col) {
        this._strokeColor.set(col);
    }

    fade(val, dur, timing = "linear", onEnd = null) {
        this._opacity.animate(val, dur, timing, onEnd);
    }

    getBoundingBox() {
        return {
            x: 0,
            y: 0,
            width: 0,
            height: 0
        };
    }

    initComponent() {
        this.scene.addDrawable(this);
    }

    drawInternal(ctx) {
        if(!this.visible) {
            return;
        }
        ctx.save();
        if(this.shadowColor != "transparent" && (this.shadow.x != 0 || this.shadow.y != 0)) {
            ctx.save();
            ctx.translate(this.shadow.x, this.shadow.y);
            this.drawShadow(ctx);
            ctx.restore();
        }
        this.draw(ctx);
        ctx.restore();
    }

    draw(_) {}

    drawShadow(_) {}

    update(elapsedTimeS) {
        this._opacity.update(elapsedTimeS);
    }
}

export class FixedDrawable extends Drawable {

    _flip;
    _scale;
    _image = null;
    _imageOptions = null;
    _center = new Vector();
    _width;
    _height;
    _imageParams = null;
    _shaker = new Shaker();

    /**
     * 
     * @param {Object} params
     * @param {{ x: number, y: number }} params.scale
     * @param {number} params.width
     * @param {number} params.height
     * @param {{ src: string, frameWidth: number, frameHeight: number, framePosition: {x: number, y: number} }} params.image
     *  
     */

    constructor(params = {}) {
        super(params);
        this._imageParams = paramParser.parseValue(params.image, null);
        const scale = paramParser.parseObject(params.scale, { x: 1.0, y: 1.0 });
        this._scale = { x: new Animator(scale.x), y: new Animator(scale.y) };
        this._width = paramParser.parseValue(params.width, 0);
        this._height = paramParser.parseValue(params.height, 0);
    }

    get width() {
        return this._width;
    }

    set width(num) {
        this._width = Math.max(num, 0);
    }

    get height() {
        return this._height;
    }

    set height(num) {
        this._height = Math.max(num, 0);
    }
    
    get scale() {
        return {
            x: this._scale.x.value,
            y: this._scale.y.value
        };
    }

    set scale(param) {
        const obj = paramParser.parseObject(param, { x: this._scale.x.value, y: this._scale.y.value });
        this._scale.x.value = obj.x;
        this._scale.y.value = obj.y;
    }

    get center() {
        return this._center;
    }

    set center(v) {
        this._center.copy(v);
    }

    get shaker() {
        return this._shaker;
    }

    scaleTo(param, dur, timing = "linear", onEnd = null) {
        const obj = paramParser.parseObject(param, { x: this._scale.x.value, y: this._scale.y.value });
        if(this._scale.x.value != obj.x) {
            this._scale.x.animate(obj.x, dur, timing, onEnd);
        }
        if(this._scale.y.value != obj.y) {
            this._scale.y.animate(obj.y, dur, timing, onEnd);
        }
    }

    initComponent() {
        super.initComponent();
        if(this._imageParams !== null) {
            this._image = this.scene.resources.get(this._imageParams.name);
            this._imageOptions = paramParser.parseObject(this._imageParams, {
                width: this._image.width,
                height: this._image.height,
                frameWidth: this._image.width,
                frameHeight: this._image.height,
                framePosition: { x: 0, y: 0 }
            });
        }
    }

    getBoundingBox() {
        const d = Math.hypot(this._width, this._height);
        return {
            width: d * Math.abs(this.scale.x),
            height: d * Math.abs(this.scale.y),
            x: this.position.x - this._center.x * Math.abs(this.scale.x),
            y: this.position.y - this._center.y * Math.abs(this.scale.y)
        }
    }

    drawInternal(ctx) {
        if(!this.visible) {
            return;
        }
        ctx.save();
        ctx.translate(this.position.x + this._shaker.offset.x, this.position.y + this._shaker.offset.y);
        if(this.shadowColor != "transparent" && (this.shadow.x != 0 || this.shadow.y != 0)) {
            ctx.save();
            ctx.translate(this.shadow.x, this.shadow.y);
            ctx.scale(this.scale.x, this.scale.y);
            ctx.rotate(this.angle);
            ctx.translate(-this._center.x, -this._center.y);
            this.drawShadow(ctx);
            ctx.restore();
        }
        ctx.scale(this.scale.x, this.scale.y);
        ctx.rotate(this.angle);
        ctx.translate(-this._center.x, -this._center.y);
        this.draw(ctx);
        ctx.restore();
    }
    drawImage(ctx, w = this._imageOptions.width, h = this._imageOptions.height, clip = true, framePos = this._imageOptions.framePosition) {
        if(clip) {
            ctx.clip();
        }
        ctx.drawImage(this._image, framePos.x * this._imageOptions.frameWidth, framePos.y * this._imageOptions.frameHeight, this._imageOptions.frameWidth, this._imageOptions.frameHeight, -w / 2, -h / 2, w, h);
    }

    update(elapsedTimeS) {
        super.update(elapsedTimeS);
        this._scale.x.update(elapsedTimeS);
        this._scale.y.update(elapsedTimeS);
        this._shaker.update(elapsedTimeS);
        this._angle.update(elapsedTimeS);
    }

    followBody() {
        let body = this.parent.body;
        if(!body) {
            return;
        }
        this.parent.addComponent(new BodyFollower({
            target: this
        }));
    }

    setSize(w, h) {
        this._width = w;
        this._height = h;
    }
}

class BodyFollower extends Component {
    constructor(params) {
        super();
        this._target = params.target;
    }

    update(elapsedTimeS) {
        const body = this.parent.body;
        this._target.angle = body.angle;
        this._target.offset = body.offset;
    }
}