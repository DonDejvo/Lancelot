import { Animator } from "../utils/Animator.js";
import { math } from "../utils/Math.js";
import { Shaker } from "../utils/Shaker.js";
import { Vector } from "../utils/Vector.js";
import { Entity } from "./Entity.js";

export class Camera extends Entity {
    
    _scale = new Animator(1.0);
    _target = null;
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

    follow(target, t = 4) {
        this._target = target;
        this._t = t;
    }

    unfollow() {
        this._target = null;
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
            let t = math.sat(this._t * elapsedTimeS * 60);
            this.position.lerp(this._target.position, t);
        } else {
            const vel = this._vel.clone();
            vel.mult(elapsedTimeS);
            this.position.add(vel);
        }

        this._scale.update(elapsedTimeS);
        this._shaker.update(elapsedTimeS);

    }
}