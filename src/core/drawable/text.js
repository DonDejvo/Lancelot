import { FixedDrawable } from "./drawable.js";
import { ParamParser } from "../utils/param-parser.js";

export class Text extends FixedDrawable {
    constructor(params) {
        super(params);
        this._text = params.text;
        this._lines = this._text.split(/\n/);
        this._padding = ParamParser.ParseValue(params.padding, 0);
        this._align = ParamParser.ParseValue(params.align, "center");
        this._fontSize = ParamParser.ParseValue(params.fontSize, 16);
        this._fontFamily = ParamParser.ParseValue(params.fontFamily, "Arial");
        this._fontStyle = ParamParser.ParseValue(params.fontStyle, "normal");

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
        let offsetX = this._align == "left" ? -this._width / 2 : this._align == "right" ? this._width / 2 : 0;
        ctx.font = `${this._fontStyle} ${this._fontSize}px '${this._fontFamily}'`;
        ctx.textAlign = this._align;
        ctx.textBaseline = "middle";
        ctx.beginPath();
        for(let i = 0; i < this.linesCount; ++i) {
            ctx.fillText(this._lines[i], offsetX + this._padding, this.lineHeight * i - (this.linesCount - 1) / 2 * this.lineHeight);
        }
    }
}