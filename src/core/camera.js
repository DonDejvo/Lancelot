import { Animator } from "../utils/Animator.js";
import { math } from "../utils/Math.js";
import { paramParser } from "../utils/ParamParser.js";
import { Shaker } from "../utils/Shaker.js";
import { Vector } from "../utils/Vector.js";
import { Entity } from "./Entity.js";

export class Camera extends Entity {
    
    _scale = new Animator(1.0);
    _target = null;
    _followOptions = null;
    _t = 4;
    _vel = new Vector();
    _shaker = new Shaker();
    
    constructor(scene, n) {
        super(scene, n);
    }

    get position() {
        return this._position.position;
    }

    get scale() {
        return this._scale.value;
    }

    set scale(n) {
        if(n > 0) {
            this._scale.value = n;
        }
    }

    get velocity() {
        return this._vel;
    }

    set velocity(v) {
        this._vel.copy(v);
    }

    get shaker() {
        return this._shaker;
    }

    follow(target, options = {}) {
        this._target = target;
        this._followOptions = paramParser.parseObject(options, {
            x: true,
            y: true,
            transition: 1.0
        });
    }

    unfollow() {
        this._target = null;
        this._followOptions = null;
    }

    isScaling() {
        return this._scale.isAnimating();
    }

    scaleTo(n, dur, timing = "linear", onEnd = null) {
        this._scale.animate(n, dur, timing, onEnd);
    }

    stopScaling() {
        this._scale.stopAnimating();
    }

    moveAndScale(v, n, dur, timing = "linear", onEnd = null) {
        this.moveTo(v, dur, timing, onEnd);
        this.scaleTo(n, dur, timing);
    }

    stop() {
        this.stopMoving();
        this.stopScaling();
    }

    _updatePosition(elapsedTimeS) {

        if (this.isMoving()) {
            this._position.update(elapsedTimeS);
        } else if (this._target != null) {
            let t = math.sat(this._followOptions.transition * elapsedTimeS * 60);
            if(this._followOptions.x && this._followOptions.y) {
                this.position.lerp(this._target.position, t);
            } else {
                if(this._followOptions.x) {
                    this.position.x = math.lerp(t, this.position.x, this._target.position.x);
                } else if(this._followOptions.y) {
                    this.position.y = math.lerp(t, this.position.y, this._target.position.y);
                }
            }
        } else {
            const vel = this._vel.clone();
            vel.mult(elapsedTimeS);
            this.position.add(vel);
        }

        this._scale.update(elapsedTimeS);
        this._shaker.update(elapsedTimeS);

    }
}