import { Component } from "../component.js";
import { Vector } from "../utils/vector.js";

export class Drawable extends Component {
    constructor(params) {
        super();
        this._type = "drawable";
        this._params = params;
        this._width = (this._params.width || 0);
        this._height = (this._params.height || 0);
        this._zIndex = (this._params.zIndex || 0);
        this.flip = {
            x: (this._params.flipX || false),
            y: (this._params.flipY || false)
        };
        this._rotationCount = (this._params.rotationCount || 0);
        this.opacity = this._params.opacity !== undefined ? this._params.opacity : 1;
        this._angle = (this._params.angle || this._rotationCount * Math.PI / 2 || 0);

        this.boundingBox = { width: 0, height: 0, x: 0, y: 0 };
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
        this._UpdateBoundingBox();
    }
    set height(num) {
        this._height = num;
        this._UpdateBoundingBox();
    }
    set angle(num) {
        this._angle = num;
        this._UpdateBoundingBox();
    }
    get angle() {
        return this._angle;
    }
    get rotationCount() {
        return this._rotationCount;
    }
    set rotationCount(num) {
        this._rotationCount = num;
        this.angle = this._rotationCount * Math.PI / 2;
    } 
    InitComponent() {
        this._UpdateBoundingBox();
    }
    _UpdateBoundingBox() {
        const vertices = new Array(4);
        vertices[0] = new Vector(-this._width / 2, -this._height / 2).Rotate(this._angle);
        vertices[1] = new Vector(this._width / 2, -this._height / 2).Rotate(this._angle);
        vertices[2] = new Vector(this._width / 2, this._height / 2).Rotate(this._angle);
        vertices[3] = new Vector(-this._width / 2, this._height / 2).Rotate(this._angle);
        let width = 0, height = 0;
        for(let i = 0; i < 2; ++i) {
            const w = Math.abs(vertices[i].x) + Math.abs(vertices[i + 2].x);
            const h = Math.abs(vertices[i].y) + Math.abs(vertices[i + 2].y);
            if(w > width) {
                width = w;
            }
            if(h > height) {
                height = h;
            }
        }
        this.boundingBox.width = width;
        this.boundingBox.height = height;
    }
    SetSize(w, h) {
        this._width = w;
        this._height = h;
    }
    Draw(_) { }
}

export class Text extends Drawable {
    constructor(params) {
        super(params);
        this._text = this._params.text;
        this._lines = this._text.split(/\n/);
        this._padding = (this._params.padding || 0);
        this._fontSize = (this._params.fontSize || 16);
        this._fontFamily = (this._params.fontFamily || "Arial");
        this._color = (this._params.color || "black");

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
    _ComputeDimensions() {
        this._height = this.lineHeight * this.linesCount;
        let maxWidth = 0;
        const ctx = document.createElement("canvas").getContext("2d");
        ctx.font = `${this._fontSize}px '${this._fontFamily}'`;
        for(let line of this._lines) {
            const lineWidth = ctx.measureText(line).width;
            if(lineWidth > maxWidth) {
                maxWidth = lineWidth;
            }
        }
        this._width = maxWidth;
    }
    Draw(ctx) {
        ctx.beginPath();
        ctx.save();
        ctx.globalAlpha = this.opacity;
        ctx.translate(this._pos.x, this._pos.y);
        ctx.rotate(this.angle);
        ctx.fillStyle = this._color;
        ctx.font = `${this._fontSize}px '${this._fontFamily}'`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        for(let i = 0; i < this.linesCount; ++i) {
            ctx.fillText(this._lines[i], 0, this.lineHeight * i - (this.linesCount - 1) / 2 * this.lineHeight);
        }
        ctx.restore();
    }
}

export class Picture extends Drawable {
    constructor(params) {
        super(params);
        this._image = this._params.image;
        this._frameWidth = (this._params.frameWidth || this._image.width);
        this._frameHeight = (this._params.frameHeight || this._image.height);
        this._framePos = {
            x: (this._params.posX || 0),
            y: (this._params.posY || 0)
        };
    }
    Draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.opacity;
        ctx.translate(this._pos.x, this._pos.y);
        ctx.scale(this.flip.x ? -1 : 1, this.flip.y ? -1 : 1);
        ctx.rotate(this.angle);
        ctx.drawImage(this._image, this._framePos.x * this._frameWidth, this._framePos.y * this._frameHeight, this._frameWidth, this._frameHeight, -this._width / 2, -this._height / 2, this._width, this._height);
        ctx.restore();
    }
}

export class Rect extends Drawable {
    constructor(params) {
        super(params);
        this.background = (this._params.background || "black");
        this.borderColor = (this._params.borderColor || "black");
        this.borderWidth = (this._params.borderWidth || 0);
    }
    Draw(ctx) {
        ctx.beginPath();
        ctx.save();
        ctx.globalAlpha = this.opacity;
        ctx.translate(this._pos.x, this._pos.y);
        ctx.rotate(this.angle);
        ctx.fillStyle = this.background;
        ctx.strokeStyle = this.borderColor;
        ctx.lineWidth = this.borderWidth;
        ctx.rect(-this._width / 2, -this._height / 2, this._width, this._height);
        ctx.fill();
        if(this.borderWidth > 0) ctx.stroke();
        ctx.restore();
    }
}

export class Circle extends Drawable {
    constructor(params) {
        super(params);
        this._radius = this._params.radius;
        this._width = this._radius * 2;
        this._height = this._radius * 2;
        this.background = (this._params.background || "black");
        this.borderColor = (this._params.borderColor || "black");
        this.borderWidth = (this._params.borderWidth || 0);
    }
    get radius() {
        return this._radius;
    }
    set radius(val) {
        this._radius = val;
        this._width = this._radius * 2;
        this._height = this._radius * 2;
        this._UpdateBoundingBox();
    }
    Draw(ctx) {
        ctx.beginPath();
        ctx.save();
        ctx.globalAlpha = this.opacity;
        ctx.translate(this._pos.x, this._pos.y);
        ctx.fillStyle = this.background;
        ctx.strokeStyle = this.borderColor;
        ctx.lineWidth = this.borderWidth;
        ctx.arc(0, 0, this._radius, 0, 2 * Math.PI);
        ctx.fill();
        if(this.borderWidth > 0) ctx.stroke();
        ctx.restore();
    }
}

export class Sprite extends Drawable {
    constructor(params) {
        super(params);
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
    Update(timeElapsed) {
        if(this._paused) {
            return;
        }
        const currentAnim = this._currentAnim;
        const frames = this._anims.get(currentAnim.name);
        currentAnim.counter += timeElapsed * 1000;
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
        ctx.save();
        ctx.globalAlpha = this.opacity;
        ctx.translate(this._pos.x, this._pos.y);
        ctx.scale(this.flip.x ? -1 : 1, this.flip.y ? -1 : 1);
        ctx.rotate(this.angle);
        ctx.drawImage(
            this._params.image,
            this._framePos.x * this._params.frameWidth, this._framePos.y * this._params.frameHeight, this._params.frameWidth, this._params.frameHeight,  
            -this._width / 2, -this._height / 2, this._width, this._height
        );
        ctx.restore();
    }
}