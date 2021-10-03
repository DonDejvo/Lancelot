import { Component } from "../component.js";
import { Vector } from "../utils/vector.js";

/*

position: Vector
velocity: Vector
mass: number
bounce: number
rotating: number
friction: { x: number, y: number }

*/

class Body extends Component {
    constructor() {
        super();
        this._vel = new Vector();
        this.mass = (params.mass || Infinity);
        this.bounce = (params.bounce || 0);
        this.angle = (params.angle || 0);
        this.rotating = (params.rotating || 0);
        this.friction = {
            x: (params.frictionX || 0),
            y: (params.frictionY || 0)
        }
    }
    get velocity() {
        return this._vel;
    }
    set velocity(vec) {
        this._vel.Copy(vec);
    }

}