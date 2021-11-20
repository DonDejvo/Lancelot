import { Vector } from "./Vector.js";
import { math } from "./Math.js";

export class Shaker {
    
    _offset = new Vector();
    _anim = null;

    get offset() {
        return this._offset;
    }
    
    shake(range, dur, freq, angle) {
        const count = freq * dur / 1000;
        this._anim = {
            counter: 0,
            count: count,
            angle: angle,
            dur: dur,
            range: range
        };
    }

    isShaking() {
        return this._anim !== null;
    }

    stopShaking() {
        this._anim = null;
        this._offset.set(0, 0);
    }

    update(elapsedTimeS) {
        if (this._anim) {
            const anim = this._anim;
            anim.counter += elapsedTimeS * 1000;
            const progress = math.sat(anim.counter / anim.dur);
            this._offset.copy(new Vector(Math.sin(progress * Math.PI * 2 * anim.count) * anim.range, 0).rot(anim.angle));
            if (progress == 1) {
                this.stopShaking();
            }
        }
    }
}