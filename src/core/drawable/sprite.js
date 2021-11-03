import { FixedDrawable } from "./drawable.js";
import { ParamParser } from "../utils/param-parser.js";

export class Sprite extends FixedDrawable {
    constructor(params) {
        super(params);
        this._image = this.scene.resources.get(params.src);
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
        ctx.drawImage(
            this._image,
            this._framePos.x * this._frameWidth, this._framePos.y * this._frameHeight, this._frameWidth, this._frameHeight,  
            -this._width / 2, -this._height / 2, this._width, this._height
        );
    }
}

