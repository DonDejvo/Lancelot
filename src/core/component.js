import { Vector } from "./utils/vector.js";

export class Component {
    constructor() {
        this._type = "";
        this._parent = null;
        this._pos = new Vector();
        this.offset = new Vector();
    }
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
        return this._pos;
    }
    set position(vec) {
        this._pos.Copy(vec);
        this._parent.SetPosition(vec.Clone().Sub(this.offset));
    }
    InitComponent() { }
    GetComponent(n) {
        return this._parent.GetComponent(n);
    }
    FindEntity(n) {
        return this._parent.FindEntity(n);
    }
    Update(_) { }
}