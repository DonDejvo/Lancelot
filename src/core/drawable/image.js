import { FixedDrawable } from "./drawable.js";
import { ParamParser } from "../utils/param-parser.js";

export class Image extends FixedDrawable {
    constructor(params) {
        super(params);
    }
    Draw(ctx) {
        this.DrawImage(ctx, this._width, this._height, false);
    }
}

