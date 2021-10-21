import { Vector } from "./utils/vector.js";
import { Position } from "./utils/position.js";

/*

position: Vector
parent: Entity
type: string
scene: Scene
GetComponent(name: string)

*/

export class Component {
    constructor(params) {
        this._type = "";
        this._parent = null;
        this._position = new Position();
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
        return this._position.position;
    }
    set position(p) {
        this._position.position = p;
    }
    get offset() {
        return this._position._offset;
    }
    set offset(vec) {
        this._position._offset.Copy(vec);
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