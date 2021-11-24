import { FixedDrawable } from "./Drawable.js";

export class Sprite extends FixedDrawable {

    _anims = new Map();
    _currentAnim = null;
    _paused = true;
    _framePos = {x: 0, y: 0};

    constructor(params) {
        super(params);
    }

    get currentAnim() {
        if(this._currentAnim) {
            return this._currentAnim.name;
        }
        return null;
    }

    addAnim(n, frames) {
        this._anims.set(n, frames);
    }

    play(n, rate, repeat, onEnd) {
        if(n == undefined) {
            if(this._currentAnim) {
                this._paused = false;
            }
            return;
        }
        if(this.currentAnim == n) { return; }
        this._paused = false;
        const currentAnim = {
            name: n,
            rate: rate,
            repeat: repeat,
            OnEnd: onEnd,
            frame: 0,
            counter: 0
        }
        this._currentAnim = currentAnim;
        this._framePos = this._anims.get(currentAnim.name)[currentAnim.frame];
    }

    reset() {
        if(this._currentAnim) {
            this._currentAnim.frame = 0;
            this._currentAnim.counter = 0;
        }
    }

    pause() {
        this._paused = true;
    }

    update(timeElapsedS) {
        super.update(timeElapsedS);
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
                    currentAnim.onEnd();
                }
                if(!currentAnim.repeat) {
                    this._currentAnim = null;
                    this._paused = true;
                }
            }
            this._framePos = frames[currentAnim.frame];
        }
    }

    draw(ctx) {
        ctx.globalAlpha = this.opacity;
        this.drawImage(ctx, {
            clip: false,
            width: this._width,
            height: this._height,
            framePosition: this._framePos
        });
    }

    drawShadow(ctx) {
        this._shadowColor.fill(ctx);
        ctx.beginPath();
        ctx.rect(-this._width / 2, -this._height / 2, this._width, this._height);
        ctx.fill();
    }
}

