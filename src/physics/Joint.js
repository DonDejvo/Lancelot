import { Vector } from "../utils/Vector.js";
import { paramParser } from "../utils/ParamParser.js";
import { math } from "../utils/Math.js";

class Joint {

    _body1;
    _body2;
    _offset1;
    _offset2;
    _length;
    _strength;

    constructor(b1, b2, params) {
        this._body1 = b1;
        this._body2 = b2;
        const offset1 = paramParser.parseObject(params.offset1, { x: 0, y: 0 });
        this._offset1 = new Vector(offset1.x, offset1.y);
        const offset2 = paramParser.parseObject(params.offset2, { x: 0, y: 0 });
        this._offset2 = new Vector(offset2.x, offset2.y);

        const start = this._body1.position.clone().add(this._offset1.clone().rot(this._body1.angle));
        const end = this._body2.position.clone().add(this._offset2.clone().rot(this._body2.angle));
        this._length = paramParser.parseValue(params.length, Math.max(Vector.dist(start, end), 1));
        this._strength = paramParser.parseValue(params.strength, 1);
    }

    get offset1() {
        return this._offset1;
    }

    set offset1(v) {
        this._offset1.copy(v);
    }

    get offset2() {
        return this._offset2;
    }

    set offset2(v) {
        this._offset2.copy(v);
    }

    get length() {
        return this._length;
    }

    set length(val) {
        this._length = Math.max(val, 1);
    }

    get strength() {
        return this._strength;
    }

    set strength(val) {
        this._strength = math.sat(val);
    }

    update(_) {}
}

export class ElasticJoint extends Joint {

    constructor(b1, b2, params) {
        super(b1, b2, params);
    }

    update(elapsedTimeS) {

        if(this._body1.mass === 0 && this._body2.mass === 0) return;

        const offset1 = this.offset1.clone().rot(this._body1.angle);
        const offset2 = this.offset2.clone().rot(this._body2.angle);
        const start = this._body1.position.clone().add(offset1);
        const end = this._body2.position.clone().add(offset2);

        const vec = start.clone().sub(end);
        const n = vec.clone().unit();
        const dist = vec.mag();

        const relLenDiff = (dist - this.length) / this.length;

        const relVel = n.clone().mult(relLenDiff * -this.strength * 512 / (this._body1.inverseMass + this._body2.inverseMass));

        const vel1 = relVel.clone().mult(this._body1.inverseMass);
        this._body1.velocity.add(vel1.clone().mult(elapsedTimeS));
        this._body1.angularVelocity += Vector.cross(offset1, vel1.clone().mult(1 / this._body1.inertia)) * elapsedTimeS;

        const vel2 = relVel.clone().mult(this._body2.inverseMass);
        this._body2.velocity.sub(vel2.clone().mult(elapsedTimeS));
        this._body2.angularVelocity -= Vector.cross(offset2, vel2.clone().mult(1 / this._body2.inertia)) * elapsedTimeS;
        
    }
}

export class SolidJoint extends Joint {

    constructor(b1, b2, params) {
        super(b1, b2, params);
    }

    update(elapsedTimeS) {

        if(this._body1.mass === 0 && this._body2.mass === 0) return;

        const offset1 = this.offset1.clone().rot(this._body1.angle);
        const offset2 = this.offset2.clone().rot(this._body2.angle);
        const start = this._body1.position.clone().add(offset1);
        const end = this._body2.position.clone().add(offset2);

        const vec = start.clone().sub(end);
        const n = vec.clone().unit();
        const dist = vec.mag();

        const repos = 16;
        const diff = n.clone().mult((dist - this.length) * -1 / (this._body1.inverseMass + this._body2.inverseMass));
        this._body1.position.add(diff.clone().mult(this._body1.inverseMass * repos * elapsedTimeS));
        this._body2.position.sub(diff.clone().mult(this._body2.inverseMass * repos * elapsedTimeS));

        const relLenDiff = (dist - this.length) / this.length;

        const relVel = n.clone().mult(relLenDiff * -this.strength * 512 / (this._body1.inverseMass + this._body2.inverseMass));

        const vel1 = relVel.clone().mult(this._body1.inverseMass);
        this._body1.velocity.add(vel1.clone().mult(elapsedTimeS));
        this._body1.angularVelocity += Vector.cross(offset1, vel1.clone().mult(1 / this._body1.inertia)) * elapsedTimeS;

        const vel2 = relVel.Clone().Mult(this._body2.inverseMass);
        this._body2.velocity.Sub(vel2.Clone().Mult(elapsedTimeS));
        this._body2.angularVelocity -= Vector.Cross(offset2, vel2.Clone().Mult(1 / this._body2.inertia)) * elapsedTimeS;

    }
}