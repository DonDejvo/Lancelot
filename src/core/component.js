import { Animator } from "../utils/Animator.js";
import { PositionManager } from "../utils/PositionManager.js";

export class Component {

    _type = "";
    _parent = null;
    _position = new PositionManager();
    _angle = new Animator(0);

    get type() {
        return this._type;
    }

    get scene() {
        return this._parent._scene;
    }

    get parent() {
        return this._parent;
    }

    get position() {
        return this._position.position;
    }

    set position(v) {
        this._position.position = v;
    }

    get offset() {
        return this._position.offset;
    }

    set offset(v) {
        this._position.offset = v;
    }

    get angle() {
        return this._angle.value;
    }

    set angle(num) {
        this._angle.value = num;
    }

    initComponent() {}

    getComponent(n) {
        return this._parent.getComponent(n);
    }

    rotate(val, dur, timing = "linear", onEnd = null) {
        this._angle.animate(val, dur, timing, onEnd);
    }

    update(_) {}
}