import { PositionManager } from "../utils/PositionManager.js";

export class Entity {

    _name = null;
    _scene = null;
    _parent = null;
    _groupList = new Set();
    _components = new Map();
    _position = new PositionManager();
    _interactive = null;
    _body = null;
    _onUpdate = null;
    _properties = new Map();

    get name() {
        return this._name;
    }
    
    get scene() {
        return this._scene;
    }

    get position() {
        return this._position.position;
    }

    set position(v) {
        this._position.position = v;
    }

    get interactive() {
        return this._interactive;
    }

    get body() {
        return this._body;
    }

    get groupList() {
        return this._groupList;
    }

    get props() {
        return this._properties;
    }

    clip(e, fixed = false) {
        this._position.clip(e._position, fixed);
    }

    unclip(e) {
        this._position.unclip(e._position);
    }

    moveTo(v, dur, timing = "linear", onEnd = null) {
        this._position.moveTo(v, dur, timing, onEnd);
    }

    moveBy(v, dur, timing = "linear", onEnd = null) {
        this._position.moveBy(v, dur, timing, onEnd);
    }

    stopMoving() {
        this._position.stopMoving();
    }

    isMoving() {
        return this._position.isMoving();
    }

    addComponent(c, n) {
        if (n === undefined) {
            n = c.constructor.name;
        }
        this._components.set(n, c);
        c._parent = this;
        c.position.copy(this.position.clone().add(c.offset));
        this.clip(c, true);
        c.initComponent();
    }

    getComponent(n) {
        return this._components.get(n);
    }

    _updatePosition(elapsedTimeS) {
        this._position.update(elapsedTimeS);
    }

    update(elapsedTimeS) {
        this._updatePosition(elapsedTimeS);
        if(this._onUpdate) {
            this._onUpdate(elapsedTimeS);
        }
        this._components.forEach((c) => {
            c.update(elapsedTimeS);
        });
    }

    onUpdate(callback) {
        this._onUpdate = callback;
    }
}