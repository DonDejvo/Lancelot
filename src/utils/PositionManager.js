import { ParamVector } from "./Vector.js";
import { math } from "./Math.js";

export class PositionManager {

    _pos;
    _parent = null;
    _fixed = false;
    _offset;
    _attached = [];
    _anim = null;

    constructor() {
        this._pos = new ParamVector(this._onPositionChange.bind(this));
        this._offset = new ParamVector(this._onOffsetChange.bind(this));
    }
    
    get position() {
        return this._pos;
    }

    set position(v) {
        this._pos.copy(v);
    }

    get offset() {
        return this._offset;
    }

    set offset(v) {
        this._offset.copy(v);
    }

    clip(p, fixed = false) {
        this._attached.push(p);
        p._parent = this;
        p._fixed = fixed;
        p._offset.copy(p.position.clone().sub(this._pos));
    }

    unclip(p) {
        const i = this._attached.indexOf(p);
        if(i != -1) {
            this._attached.splice(i, 1);
            p._parent = null;
        }
    }

    moveTo(v, dur, timing = "linear", onEnd = null) {
        this._anim = {
            counter: 0,
            dur: dur,
            from: this.position.clone(),
            to: v,
            timing: timing,
            onEnd: onEnd
        };
    }

    stopMoving() {
        this._anim = null;
    }

    isMoving() {
        return this._anim != null;
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
            }
            this._pos.copy(anim.from.clone().lerp(anim.to, value));
            if (progress == 1) {
                this.stopMoving();
                if(anim.onEnd) {
                    anim.onEnd();
                }
            }
        }
    }
    _onPositionChange() {
        if(this._parent) {
            if(this._fixed) {
                this._parent.position.copy(this._pos.clone().sub(this._offset));
            } else {
                this._offset.copy(this._pos.clone().sub(this._parent.position));
            }
        }
        for(let p of this._attached) {
            p.position.copy(this._pos.clone().add(p._offset));
        }
    }
    _onOffsetChange() {
        if(this._parent && this._fixed) {
            this._pos.copy(this._parent.position.clone().add(this._offset));
        }
    }
}