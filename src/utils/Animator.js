import { math } from "./Math.js";

export class Animator {
    
    _value;
    _anim = null;

    constructor(val) {
        this._value = val;
    }

    get value() {
        return this._value;
    }

    set value(val) {
        this._value = val;
    }
    
    animate(val, dur, timing = "linear", onEnd = null) {
        this._anim = {
            counter: 0,
            dur: dur,
            from: this._value,
            to: val,
            timing: timing,
            onEnd: onEnd
        };
    }

    isAnimating() {
        return this._anim !== null;
    }

    stopAnimating() {
        this._anim = null;
    }

    update(elapsedTimeS) {
        if (this._anim) {
            const anim = this._anim;
            anim.counter += elapsedTimeS * 1000;
            const progress = math.sat(anim.counter / anim.dur);
            let value;
            switch (anim.timing) {
                case "linear":
                    value = progress;
                    break;
                case "ease-in":
                    value = math.easeIn(progress);
                    break;
                case "ease-out":
                    value = math.easeOut(progress);
                    break;
                case "ease-in-out":
                    value = math.easeInOut(progress);
                    break;
                default:
                    value = progress;
            }
            this._value = math.lerp(value, anim.from, anim.to);
            if (progress == 1) {
                this.stopAnimating();
                if(anim.onEnd) {
                    anim.onEnd();
                }
            }
        }
    }
}