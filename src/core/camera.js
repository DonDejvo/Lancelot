import { Position } from "./utils/position.js";
import { Vector } from "./utils/vector.js";

export class Camera {
    constructor() {
        this._position = new Position(this);
        this._pos = this._position._pos;
        this.scale = 1.0;
        this._target = null;
        this._vel = new Vector();
        this._scaling = null;
        this._shaking = null;
        this._offset = new Vector();
    }
    get position() {
        return this._position._pos.Clone();
    }
    set position(vec) {
        this._position.SetPosition(vec);
    }
    get shaking() {
        return this._shaking;
    }
    get scaling() {
        return this._scaling;
    }
    get moving() {
        return this._position._moving;
    }
    get velocity() {
        return this._vel;
    }
    set velocity(vec) {
        this._vel.Copy(vec);
    }
    Attach(e) {
        this._position.Attach(e._position);
    }
    MoveTo(p, dur, timing = "linear") {
        this._position.MoveTo(p, dur, timing);
    }
    StopMoving() {
        this._position.StopMoving();
    }
    Follow(target) {
        this._target = target;
    }
    Unfollow() {
        this._target = null;
    }
    ScaleTo(s, dur, timing = "linear") {
        this._scaling = {
            counter: 0,
            dur: dur,
            from: this.scale,
            to: s,
            timing: timing
        };
    }
    StopScaling() {
        this._scaling = null;
    }
    Shake(range, dur, count, angle) {
        this._shaking = {
            counter: 0,
            count: count,
            angle: angle,
            dur: dur,
            range: range
        };
    }
    StopShaking() {
        this._shaking = null;
        this._offset = new Vector();
    }
    Update(elapsedTimeS) {
        
        if (this.moving) {
            this._position.Update(elapsedTimeS);
        } else if (this._target) {
            if (Vector.Dist(this._pos, this._target._pos) < 1.0) {
                this.position = this._target._pos.Clone();
            }
            else {
                const t = 4 * elapsedTimeS;
                this.position = this._pos.Clone().Lerp(this._target._pos, t);
            }
        } else {
            const vel = this._vel.Clone();
            vel.Mult(elapsedTimeS);
            this.position = this._pos.Clone().Add(vel);
        }

        if (this._scaling) {
            const anim = this._scaling;
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
            this.scale = math.lerp(value, anim.from, anim.to);
            if (progress == 1) {
                this.StopScaling();
            }
        }

        if(this._shaking) {
            const anim = this._shaking;
            anim.counter += elapsedTimeS * 1000;
            const progress = Math.min(anim.counter / anim.dur, 1);
            this.position = this._pos.Clone().Sub(this._offset);
            this._offset.Copy(new Vector(Math.sin(progress * Math.PI * 2 * anim.count) * anim.range, 0).Rotate(anim.angle));
            this.position = this._pos.Clone().Add(this._offset);
            if (progress == 1) {
                this.StopShaking();
            }
        }

        
    }
}