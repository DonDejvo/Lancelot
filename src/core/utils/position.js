import { Vector, PositionVector } from "./vector.js";
import { math } from "./math.js";

export class Position {
    constructor(parent) {
        this._parent = parent;
        this._pos = new PositionVector(parent);
        this._attached = [];
        this._moving = null;
    }
    Clip(e) {
        this._attached.push(e);
    }
    Unclip(e) {
        const i = this._attached.indexOf(e);
        if(i != -1) {
            this._attached.splice(i, 1);
        }
    }
    get position() {
        return this._pos;
    }
    set position(p) {
        for(let e of this._attached) {
            const offset = e._pos.Clone().Sub(this._pos);
            e._parent.position = p.Clone().Add(offset);
        }
        this._pos.Copy(p);
    }
    MoveTo(p, dur, timing = "linear") {
        this._moving = {
            counter: 0,
            dur: dur,
            from: this._pos.Clone(),
            to: p,
            timing: timing
        };
    }
    StopMoving() {
        this._moving = null;
    }
    Update(elapsedTimeS) {
        if (this._moving) {
            const anim = this._moving;
            anim.counter += elapsedTimeS * 1000;
            const progress = Math.min(anim.counter / anim.dur, 1);
            let value;
            switch (anim.timing) {
                case "linear":
                    value = progress;
                    break;
                case "ease-in":
                    value = math.ease_in(progress);
                    break;
                case "ease-out":
                    value = math.ease_out(progress);
                    break;
            }
            this._parent.position = anim.from.Clone().Lerp(anim.to, value);
            if (progress == 1) {
                this._moving = null;
            }
        }
    }
}