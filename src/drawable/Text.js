import { FixedDrawable } from "./Drawable.js";
import { paramParser } from "../utils/ParamParser.js";

export class Text extends FixedDrawable {

    _text;
    _lines;
    _padding;
    _align;
    _fontFamily;
    _fontSize;
    _fontStyle;

    constructor(params) {
        super(params);
        this._text = paramParser.parseValue(params.text, "");
        this._lines = this._text.split(/\n/);
        this._padding = paramParser.parseValue(params.padding, 0);
        this._align = paramParser.parseValue(params.align, "center");
        this._fontSize = paramParser.parseValue(params.fontSize, 16);
        this._fontFamily = paramParser.parseValue(params.fontFamily, "Arial");
        this._fontStyle = paramParser.parseValue(params.fontStyle, "normal");

        this._computeDimensions();
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
        this._lines = this._text.split(/\n/);
        this._computeDimensions();
    }

    get fontSize() {
        return this._fontSize;
    }

    set fontSize(val) {
        this._fontSize = Math.max(val, 0);
        this._computeDimensions();
    }

    get fontFamily() {
        return this._fontFamily;
    }

    set fontFamily(val) {
        this._fontFamily = val;
        this._computeDimensions();
    }

    get padding() {
        return this._padding;
    }

    set padding(val) {
        this._padding = val;
        this._computeDimensions();
    }

    get align() {
        return this._align;
    }

    set align(s) {
        this._align = s;
        this._computeDimensions();
    }

    _computeDimensions() {
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

    draw(ctx) {
        ctx.globalAlpha = this.opacity;
        ctx.lineWidth = this.strokeWidth;
        ctx.lineCap = this.strokeCap;
        ctx.fillStyle = this.fillColor.value;
        ctx.strokeStyle = this.strokeColor.value;
        ctx.font = `${this._fontStyle} ${this._fontSize}px '${this._fontFamily}'`;
        ctx.textAlign = this._align;
        ctx.textBaseline = "middle";
        ctx.beginPath();
        for(let i = 0; i < this.linesCount; ++i) {
            ctx.fillText(this._lines[i], this._padding, this.lineHeight * i - (this.linesCount - 1) / 2 * this.lineHeight);
            if(this._strokeWidth) {
                ctx.strokeText(this._lines[i], this._padding, this.lineHeight * i - (this.linesCount - 1) / 2 * this.lineHeight);
            }
        }
    }
    
    drawShadow(ctx) {
        ctx.lineWidth = this.strokeWidth;
        ctx.lineCap = this.strokeCap;
        ctx.fillStyle = this.shadowColor.value;
        ctx.strokeStyle = this.shadowColor.value;
        let offsetX = this._align == "left" ? -this._width / 2 : this._align == "right" ? this._width / 2 : 0;
        ctx.font = `${this._fontStyle} ${this._fontSize}px '${this._fontFamily}'`;
        ctx.textAlign = this._align;
        ctx.textBaseline = "middle";
        ctx.beginPath();
        for(let i = 0; i < this.linesCount; ++i) {
            if(this.fillColor != "transparent") {
                ctx.globalAlpha = this._fillColor.alpha;
                ctx.fillText(this._lines[i], offsetX + this._padding, this.lineHeight * i - (this.linesCount - 1) / 2 * this.lineHeight);
            }
            if(this._strokeWidth) {
                ctx.globalAlpha = this._strokeColor.alpha;
                ctx.strokeText(this._lines[i], offsetX + this._padding, this.lineHeight * i - (this.linesCount - 1) / 2 * this.lineHeight);
            }
        }
    }
    
}