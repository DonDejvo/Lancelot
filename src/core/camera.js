import { Position } from "./utils/position.js";
import { Vector } from "./utils/vector.js";
import { math } from "./utils/math.js";

export class Camera {
    constructor() {
        this._position = new Position();
        this.scale = 1.0;
        this._target = null;
        this._vel = new Vector();
        this._scaling = null;
        this._shaking = null;
        this._offset = new Vector();
    }
    get position() {
        return this._position.position;
    }
    set position(vec) {
        this._position.position.Copy(vec);
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
    Clip(e) {
        this._position.Clip(e._position);
    }
    Unclip(e) {
        this._position.Unclip(e._position);
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
    MoveAndScaleTo(p, s, dur, timing = "linear") {
        this.MoveTo(p, dur, timing);
        this.ScaleTo(s, dur, timing);
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
            const t = 4 * elapsedTimeS;
            this.position.Lerp(this._target.position, t);
        } else {
            const vel = this._vel.Clone();
            vel.Mult(elapsedTimeS);
            this.position.Add(vel);
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
            this.position.Sub(this._offset);
            this._offset.Copy(new Vector(Math.sin(progress * Math.PI * 2 * anim.count) * anim.range, 0).Rotate(anim.angle));
            this.position.Add(this._offset);
            if (progress == 1) {
                this.StopShaking();
            }
        }

        
    }
}