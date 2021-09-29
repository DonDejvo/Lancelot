import { Component } from "../component.js";
import { Vector } from "../utils/vector.js";

class Drawable extends Component {
    constructor(params) {
        super();
        this._type = "drawable";
        this._params = params;
        this._width = (this._params.width || 0);
        this._height = (this._params.height || 0);
        this._fixed = this._params.fixed === undefined ? true : this._params.fixed;
        this._zIndex = (this._params.zIndex || 0);
        this.flip = {
            x: (this._params.flipX || false),
            y: (this._params.flipY || false)
        };
        this._rotationCount = (this._params.rotationCount || 0);
        this._opacity = this._params.opacity !== undefined ? this._params.opacity : 1;
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

class Text extends Drawable {
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
        ctx.globalAlpha = this._opacity;
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

export {
    Drawable,
    Text
}