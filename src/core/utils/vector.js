/*

x: number
y: number

*/

export class Vector {
    constructor(x = 0, y = 0) {
        this._x = x;
        this._y = y;
    }
    get x() {
        return this._x;
    }
    get y() {
        return this._y;
    }
    set x(num) {
        this.Set(num, this.y);
    }
    set y(num) {
        this.Set(this.x, num);
    }
    Set(x, y) {
        this._x = x;
        this._y = y;
    }
    Copy(v1) {
        this.Set(v1.x, v1.y);
        return this;
    }
    Clone() {
        return new Vector(this.x, this.y);
    }
    Add(v1) {
        this.Set(this.x + v1.x, this.y + v1.y);
        return this;
    }
    Sub(v1) {
        this.Set(this.x - v1.x, this.y - v1.y);
        return this;
    }
    Mult(s) {
        this.Set(this.x * s, this.y * s);
        return this;
    }
    Norm() {
        this.Set(this.y, -this.x);
        return this;
    }
    Unit() {
        const z = this.Mag();
        if (z === 0) {
            return this;
        }
        this.Set(this.x / z, this.y / z);
        return this;
    }
    Mag() {
        return Math.sqrt(Math.pow(this.x, 2) + Math.pow(this.y, 2));
    }
    Lerp(v1, alpha) {
        return this.Add(v1.Clone().Sub(this).Mult(alpha));
    }
    Angle() {
        return Math.atan2(this.y, this_x);
    }
    Rotate(angle) {
        const sin =  Math.sin(angle);
        const cos = Math.cos(angle);
        const x = this.x * cos - this.y * sin;
        const y = this.x * sin + this.y * cos;
        this.Set(x, y);
        return this;
    }
    static Dot(v1, v2) {
        return v1.x * v2.x + v1.y * v2.y;
    }
    static Dist(v1, v2) {
        return v1.Clone().Sub(v2).Mag();
    }
    static Cross(v1, v2) {
        return v1.x * v2.y - v1.y * v2.x;
    }
    static AngleBetween(v1, v2) {
        const z1 = v1.Mag();
        const z2 = v2.Mag();
        if (z1 === 0 || z2 === 0) {
            return 0;
        }
        return Math.acos(Vector.Dot(v1, v2) / (z1 * z2));
    }
}

export class PositionVector extends Vector {
    constructor(positionFunction, x = 0, y = 0) {
        super(x, y);
        this._positionFunction = positionFunction;
    }
    Set(x, y) {
        if(x != this.x || y != this.y) {
            this._x = x;
            this._y = y;
            this._positionFunction();
        }
    }
}