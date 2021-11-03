import { FixedDrawable } from "./drawable.js";

export class Rect extends FixedDrawable {
    constructor(params) {
        super(params);
    }
    Draw(ctx) {
        ctx.beginPath();
        ctx.rect(-this._width / 2, -this._height / 2, this._width, this._height);
        ctx.fill();
        if(this.strokeWidth > 0) ctx.stroke();
        if(this._image) {
            ctx.clip();
            ctx.drawImage(this._image, this._imageOptions.framePosition.x * this._imageOptions.frameWidth, this._imageOptions.framePosition.y * this._imageOptions.frameHeight, this._imageOptions.frameWidth, this._imageOptions.frameHeight, -this._width / 2, -this._height / 2, this._width, this._height);
        }
    }
}