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
        this._x = num;
    }
    set y(num) {
        this._y = num;
    }
    Copy(v1) {
        this._x = v1._x;
        this._y = v1._y;
    }
    Clone() {
        return new Vector(this._x, this._y);
    }
    Add(v1) {
        this._x += v1._x;
        this._y += v1._y;
        return this;
    }
    Sub(v1) {
        this._x -= v1._x;
        this._y -= v1._y;
        return this;
    }
    Mult(s) {
        this._x *= s;
        this._y *= s;
        return this;
    }
    Norm() {
        [this._x, this._y] = [this._y, -this._x];
        return this;
    }
    Unit() {
        const z = this.Mag();
        if (z === 0) {
            return this;
        }
        this._x /= z;
        this._y /= z;
        return this;
    }
    Mag() {
        return Math.sqrt(Math.pow(this._x, 2) + Math.pow(this._y, 2));
    }
    Lerp(v1, alpha) {
        this.Add(v1.Clone().Sub(this).Mult(alpha));
        return this;
    }
    Angle() {
        return Math.atan2(this._y, this._x);
    }
    Rotate(angle) {
        const x = this._x * Math.cos(angle) - this._y * Math.sin(angle);
        const y = this._x * Math.sin(angle) + this._y * Math.cos(angle);
        this._x = x;
        this._y = y;
        return this;
    }
    static Dot(v1, v2) {
        return v1._x * v2._x + v1._y * v2._y;
    }
    static Dist(v1, v2) {
        return Math.sqrt(Math.pow((v1._x - v2._x), 2) + Math.pow((v1._y - v2._y), 2));
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
    constructor(parent, x = 0, y = 0) {
        super(x, y);
        this._parent = parent;
    }
    get x() {
        return this._x;
    }
    set x(num) {
        const vec = new Vector(num, this._y);
        this._parent.position = vec;
        this._x = num;
    }
    get y() {
        return this._y;
    }
    set y(num) {
        const vec = new Vector(this._x, num);
        this._parent.position = vec;
        this._y = num;
    }
}