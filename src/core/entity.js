import { Position } from "./utils/position.js";

/*

position: Vector
name: string
scene: Scene
moving: boolean
Clip(e: Entity)
Unclip(e: Entity)
MoveTo(position: Vector, duration: number, timing: string)
StopMoving()
AddComponent(c: Component, name?: string)
GetComponent(name: string)

*/


export class Entity {
    constructor() {
        this._position = new Position(this.DoWeirdStuff.bind(this));
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
    get position() {
        return this._position.position;
    }
    set position(p) {
        this._position.position = p;
    }
    get moving() {
        return this._position._moving;
    }
    DoWeirdStuff() {
        this._components.forEach((c) => {
            c.position.Copy(this.position.Clone().Add(c.offset));
        });
    }
    Update(elapsedTimeS) {
        this._position.Update(elapsedTimeS);
        this._components.forEach((c) => {
            c.Update(elapsedTimeS);
        });
    }
    Clip(e, fixed = false) {
        this._position.Clip(e._position, fixed);
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
        c.position.Copy(this.position.Clone().Add(c.offset));
        this.Clip(c, true);
        c.InitComponent();
        switch(c.type) {
            case "drawable":
                this.scene._AddDrawable(c);
                break;
            case "body":
                this.scene._AddBody(this, c);
                break;
            case "light":
                this._scene._lights.push(c);
        }
    }
    GetComponent(n) {
        return this._components.get(n);
    }
    FindEntity(n) {
        return this._parent.Get(n);
    }
}