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
        this._vertices = [];
        this._zIndex = ParamParser.ParseValue(params.zIndex, 0);
        this.flip = ParamParser.ParseObject(params.flip, { x: false, y: false });
        this._scale = ParamParser.ParseObject(params.scale, { x: 1, y: 1 });
        this.opacity = ParamParser.ParseValue(params.opacity, 1);
        this._angle = 0;
        this._fillStyle = ParamParser.ParseValue(params.fillStyle, "black");
        this._strokeStyle = ParamParser.ParseValue(params.strokeStyle, "black");
        this.strokeWidth = ParamParser.ParseValue(params.strokeWidth, 0);
        this.mode = ParamParser.ParseValue(params.mode, "source-over");
        this._offset = new Vector();
        this._shaking = null;
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
        this._ComputeVertices();
    }
    set height(num) {
        this._height = num;
        this._ComputeVertices();
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
        const verts = this._vertices;

        let maxDist = 0;
        let idx = 0;
        for(let i = 0; i < verts.length; ++i) {
            const v = verts[i];
            const dist = v.Mag();
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
    get position0() {
        return this.position;
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
    InitComponent() {
        this._ComputeVertices();
    }
    GetVertices() {
        const arr = [
            new Vector(-this._width / 2, -this._height / 2),
            new Vector(this._width / 2, -this._height / 2),
            new Vector(-this._width / 2, this._height / 2),
            new Vector(this._width / 2, this._height / 2)
        ];
        
        return arr;
    }
    _ComputeVertices() {
        this._vertices = this.GetVertices();
    }
    SetSize(w, h) {
        this._width = w;
        this._height = h;
    }
    Draw(_) { }
    Draw0(ctx) {
        ctx.save();
        ctx.translate(-this._offset.x, - this._offset.y);

        ctx.save();
        //ctx.globalCompositeOperation = this.mode;
        ctx.globalAlpha = this.opacity;
        //ctx.filter = this.filter;
        ctx.translate(this.position0.x, this.position0.y);
        ctx.scale(this.flip.x ? -this.scale: this.scale, this.flip.y ? -this.scale : this.scale);
        ctx.rotate(this.angle);
        ctx.fillStyle = StyleParser.ParseColor(ctx, this.fillStyle);
        ctx.strokeStyle = StyleParser.ParseColor(ctx, this.strokeStyle);
        ctx.lineWidth = this.strokeWidth;
        
        this.Draw(ctx);

        ctx.restore();

        ctx.restore();
        /*
        const bb = this.boundingBox;
        ctx.beginPath();
        ctx.strokeStyle = "orange";
        ctx.strokeRect(bb.x - bb.width/2, bb.y - bb.height/2, bb.width, bb.height);
        */
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

export class Text extends Drawable {
    constructor(params) {
        super(params);
        this._text = params.text;
        this._lines = this._text.split(/\n/);
        this._padding = ParamParser.ParseValue(params.padding, 0);
        this._align = ParamParser.ParseValue(params.align, "center");
        this._fontSize = ParamParser.ParseValue(this._params.fontSize, 16);
        this._fontFamily = ParamParser.ParseValue(this._params.fontFamily, "Arial");
        this._fontStyle = ParamParser.ParseValue(this._params.fontStyle, "normal");

        this._ComputeDimensions();
    }
    get linesCount() {
        return this._lines.length;
    }
    get lineHeight() {
        return this._fontSize + this._padding * 2;
    }
    get text() {
        return this._text;
    }
    set text(val) {
        this._text = val;
        this._ComputeDimensions();
    }
    get fontSize() {
        return this._fontSize;
    }
    set fontSize(val) {
        this._fontSize = val;
        this._ComputeDimensions();
    }
    get fontFamily() {
        return this._fontFamily;
    }
    set fontFamily(val) {
        this._fontFamily = val;
        this._ComputeDimensions();
    }
    get padding() {
        return this._padding;
    }
    set padding(val) {
        this._padding = val;
        this._ComputeDimensions();
    }
    get align() {
        return this._align;
    }
    set align(s) {
        this._align = s;
        this._ComputeDimensions();
    }
    _ComputeDimensions() {
        this._height = this.lineHeight * this.linesCount;
        let maxWidth = 0;
        const ctx = document.createElement("canvas").getContext("2d");
        ctx.font = `${this._fontStyle} ${this._fontSize}px '${this._fontFamily}'`;
        for(let line of this._lines) {
            const lineWidth = ctx.measureText(line).width;
            if(lineWidth > maxWidth) {
                maxWidth = lineWidth;
            }
        }
        this._width = maxWidth + this._padding * 2;
    }
    Draw(ctx) {
        /*
        ctx.save();
        ctx.globalCompositeOperation = this.mode;
        ctx.globalAlpha = this.opacity;
        ctx.translate(this.position0.x, this.position0.y);
        ctx.scale(this.flip.x ? -this.scale: this.scale, this.flip.y ? -this.scale : this.scale);
        ctx.rotate(this.angle);
        ctx.fillStyle = this.ParseStyle(ctx, this.fillStyle);
        */
        let offsetX = this._align == "left" ? -this._width / 2 : this._align == "right" ? this._width / 2 : 0;
        ctx.font = `${this._fontStyle} ${this._fontSize}px '${this._fontFamily}'`;
        ctx.textAlign = this._align;
        ctx.textBaseline = "middle";
        ctx.beginPath();
        for(let i = 0; i < this.linesCount; ++i) {
            ctx.fillText(this._lines[i], offsetX + this._padding, this.lineHeight * i - (this.linesCount - 1) / 2 * this.lineHeight);
        }
        /*
        ctx.restore();
        */
    }
}

export class Image extends Drawable {
    constructor(params) {
        super(params);
        this._image = params.image;
        this._frameWidth = ParamParser.ParseValue(params.frameWidth, this._image.width);
        this._frameHeight = ParamParser.ParseValue(params.frameHeight, this._image.height);
        this._framePos = ParamParser.ParseObject(params.framePosition, { x: 0, y: 0 });
    }
    Draw(ctx) {
        /*
        ctx.save();
        ctx.globalCompositeOperation = this.mode;
        ctx.globalAlpha = this.opacity;
        ctx.translate(this.position0.x, this.position0.y);
        ctx.scale(this.flip.x ? -this.scale: this.scale, this.flip.y ? -this.scale : this.scale);
        ctx.rotate(this.angle);
        */
        ctx.drawImage(this._image, this._framePos.x * this._frameWidth, this._framePos.y * this._frameHeight, this._frameWidth, this._frameHeight, -this._width / 2, -this._height / 2, this._width, this._height);
        /*
        ctx.restore();
        */
    }
}

export class Rect extends Drawable {
    constructor(params) {
        super(params);
    }
    Draw(ctx) {
        /*
        ctx.save();
        ctx.globalCompositeOperation = this.mode;
        ctx.globalAlpha = this.opacity;
        ctx.filter = this.filter;
        ctx.translate(this.position0.x, this.position0.y);
        ctx.scale(this.flip.x ? -this.scale: this.scale, this.flip.y ? -this.scale : this.scale);
        ctx.rotate(this.angle);
        ctx.fillStyle = this.ParseStyle(ctx, this.fillStyle);
        ctx.strokeStyle = this.ParseStyle(ctx, this.strokeStyle);
        ctx.lineWidth = this.strokeWidth;
        */
        ctx.beginPath();
        ctx.rect(-this._width / 2, -this._height / 2, this._width, this._height);
        ctx.fill();
        if(this.strokeWidth > 0) ctx.stroke();
        /*
        ctx.restore();
        */
    }
}

export class Circle extends Drawable {
    constructor(params) {
        super(params);
        this._radius = params.radius;
    }
    get radius() {
        return this._radius;
    }
    get boundingBox() {
        return { 
            width: this._radius * 2,
            height: this._radius * 2,
            x: this.position.x,
            y: this.position.y
        };
    }
    set radius(val) {
        this._radius = val;
    }
    Draw(ctx) {
        /*
        ctx.save();
        ctx.globalCompositeOperation = this.mode;
        ctx.globalAlpha = this.opacity;
        ctx.filter = this.filter;
        ctx.translate(this.position0.x, this.position0.y);
        ctx.scale(this.flip.x ? -this.scale: this.scale, this.flip.y ? -this.scale : this.scale);
        ctx.rotate(this.angle);
        ctx.fillStyle = this.ParseStyle(ctx, this.fillStyle);
        ctx.strokeStyle = this.ParseStyle(ctx, this.strokeStyle);
        ctx.lineWidth = this.strokeWidth;
        */
        ctx.beginPath();
        ctx.arc(0, 0, this._radius, 0, 2 * Math.PI);
        ctx.fill();
        if(this.strokeWidth > 0) ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(this.radius, 0);
        ctx.stroke();
        
        /*
        ctx.restore();
        */
    }
}

export class Poly extends Drawable {
    constructor(params) {
        super(params);
        this._points = ParamParser.ParseValue(params.points, []);
    }
    GetVertices() {
        return this._points.map((v) => new Vector(v[0], v[1]));
    }
    Draw(ctx) {
        /*
        ctx.save();
        ctx.globalCompositeOperation = this.mode;
        ctx.globalAlpha = this.opacity;
        ctx.filter = this.filter;
        ctx.translate(this.position0.x, this.position0.y);
        ctx.scale(this.flip.x ? -this.scale: this.scale, this.flip.y ? -this.scale : this.scale);
        ctx.fillStyle = this.ParseStyle(ctx, this.fillStyle);
        ctx.strokeStyle = this.ParseStyle(ctx, this.strokeStyle);
        ctx.lineWidth = this.strokeWidth;
        */
        ctx.beginPath();
        for(let i = 0; i < this._vertices.length; ++i) {
            const v = this._vertices[i];
            if(i == 0) ctx.moveTo(v.x, v.y);
            else ctx.lineTo(v.x, v.y);
        }
        ctx.closePath();
        ctx.fill();
        if(this.strokeWidth > 0) ctx.stroke();
        /*
        ctx.restore();
        */
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
}

export class Sprite extends Drawable {
    constructor(params) {
        super(params);
        this._image = params.image;
        this._frameWidth = ParamParser.ParseValue(params.frameWidth, this._image.width);
        this._frameHeight = ParamParser.ParseValue(params.frameHeight, this._image.height);
        this._anims = new Map();
        this._currentAnim = null;
        this._paused = true;
        this._framePos = {x: 0, y: 0};
    }
    AddAnim(n, frames) {
        this._anims.set(n, frames);
    }
    PlayAnim(n, rate, repeat, OnEnd) {
        if(this.currentAnim == n) { return; }
        this._paused = false;
        const currentAnim = {
            name: n,
            rate: rate,
            repeat: repeat,
            OnEnd: OnEnd,
            frame: 0,
            counter: 0
        }
        this._currentAnim = currentAnim;
        this._framePos = this._anims[currentAnim.name][currentAnim.frame];
    }
    Reset() {
        if(this._currentAnim) {
            this._currentAnim.frame = 0;
            this._currentAnim.counter = 0;
        }
    }
    Pause() {
        this._paused = true;
    }
    Resume() {
        if(this._currentAnim) {
            this._paused = false;
        }
    }
    Update(timeElapsedS) {
        super.Update(timeElapsedS);
        if(this._paused) {
            return;
        }
        const currentAnim = this._currentAnim;
        const frames = this._anims.get(currentAnim.name);
        currentAnim.counter += timeElapsedS * 1000;
        if(currentAnim.counter >= currentAnim.rate) {
            currentAnim.counter = 0;
            ++currentAnim.frame;
            if(currentAnim.frame >= frames.length) {
                currentAnim.frame = 0;
                if(currentAnim.OnEnd) {
                    currentAnim.OnEnd();
                }
                if(!currentAnim.repeat) {
                    this._currentAnim = null;
                    this._paused = true;
                }
            }
            this._framePos = frames[currentAnim.frame];
        }
    }
    get currentAnim() {
        if(this._currentAnim) {
            return this._currentAnim.name;
        }
        return null;
    }
    Draw(ctx) {
        /*
        ctx.save();
        ctx.globalCompositeOperation = this.mode;
        ctx.globalAlpha = this.opacity;
        ctx.translate(this.position0.x, this.position0.y);
        ctx.scale(this.flip.x ? -this.scale: this.scale, this.flip.y ? -this.scale : this.scale);
        ctx.rotate(this.angle);
        */
        ctx.drawImage(
            this._image,
            this._framePos.x * this._frameWidth, this._framePos.y * this._frameHeight, this._frameWidth, this._frameHeight,  
            -this._width / 2, -this._height / 2, this._width, this._height
        );
        /*
        ctx.restore();
        */
    }
}

export class Line extends Drawable {
    constructor(params) {
        super(params);
        this.length = params.length;
    }
    get boundingBox() {
        return { 
            width: this.length * 2,
            height: this.length * 2,
            x: this.position.x,
            y: this.position.y
        };
    }
    Draw(ctx) {
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(this.length, 0);
        ctx.stroke();
    }
}