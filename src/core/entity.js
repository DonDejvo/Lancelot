import { Position } from "./utils/position.js";


export class Entity {
    constructor() {
        this._position = new Position(this);
        this._pos = this._position._pos;
        this._components = new Map();
        this._parent = null;
        this._name = null;
        this._scene = null;
        this.groupList = new Set();
    }
    get name() {
        return this._name;
    }
    get scene() {
        return this._scene;
    }
    get parent() {
        return this._parent;
    }
    get position() {
        return this._pos;
    }
    set position(p) {
        this._position.position = p;
        this._components.forEach((c) => {
            c._pos.Copy(this._pos.Clone().Add(c.offset));
        });
    }
    get moving() {
        return this._position._moving;
    }
    Update(elapsedTimeS) {
        this._position.Update(elapsedTimeS);
        this._components.forEach((c) => {
            c.Update(elapsedTimeS);
        });
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
    AddComponent(c, n) {
        if (n === undefined) {
            n = c.constructor.name;
        }
        this._components.set(n, c);
        c._parent = this;
        c._pos.Copy(this._pos.Clone().Add(c.offset));
        c.InitComponent();
    }
    GetComponent(n) {
        return this._components.get(n);
    }
    FindEntity(n) {
        return this._parent.Get(n);
    }
}