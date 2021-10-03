import { Vector, PositionVector } from "./vector.js";
import { math } from "./math.js";

/*

position: Vector
moving: boolean
Clip(p: Position)
Unclip(p: Position)
MoveTo(position: Vector, duration: number, timing?: string)
StopMoving()

*/

export class Position {
    constructor() {
        this._pos = new PositionVector(this.DoWeirdStuff.bind(this));
        this._parent = null;
        this._fixed = false;
        this._offset = new PositionVector(this.DoWeirdStuffWithOffset.bind(this));;
        this._attached = [];
        this._moving = null;
    }
    Clip(p, fixed = false) {
        this._attached.push(p);
        p._parent = this;
        p._fixed = fixed;
        p._offset.Copy(p.position.Clone().Sub(this.position));
    }
    Unclip(e) {
        const i = this._attached.indexOf(e);
        if(i != -1) {
            this._attached.splice(i, 1);
            e._parent = null;
        }
    }
    get position() {
        return this._pos;
    }
    set position(p) {
        this.position.Copy(p);
    }
    MoveTo(p, dur, timing = "linear") {
        this._moving = {
            counter: 0,
            dur: dur,
            from: this.position.Clone(),
            to: p,
            timing: timing
        };
    }
    StopMoving() {
        this._moving = null;
    }
    DoWeirdStuff() {
        
        if(this._parent) {
            if(this._fixed) {
                this._parent.position.Copy(this.position.Clone().Sub(this._offset));
            } else {
                this._offset.Copy(this.position.Clone().Sub(this._parent.position));
            }
        }
        for(let p of this._attached) {
            p.position.Copy(this.position.Clone().Add(p._offset));
        }
    }
    DoWeirdStuffWithOffset() {
        if(this._parent && this._fixed) {
            this.position.Copy(this._parent.position.Clone().Add(this._offset));
        }
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
            this.position.Copy(anim.from.Clone().Lerp(anim.to, value));
            if (progress == 1) {
                this._moving = null;
            }
        }
    }
}