import { Animator } from "../utils/Animator.js";
import { Shaker } from "../utils/Shaker.js";
import { Vector } from "../utils/Vector.js";
import { Entity } from "./Entity.js";

export class Camera extends Entity {
    
    _scale = new Animator(1.0);
    _target = null;
    _followOffset = 4;
    _vel = new Vector();
    _shaker = new Shaker();
    
    constructor() {
        super();
    }

    get position() {
        return this._position.position.clone().add(this._shaker.offset);
    }

    get scale() {
        return this._scale.value;
    }

    set scale(n) {
        this._scale.value = n;
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

    follow(target, offset = 4) {
        this._target = target;
        this._followOffset = offset;
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
        } else if (this._target !== null) {
            let t = this._followOffset * elapsedTimeS;
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