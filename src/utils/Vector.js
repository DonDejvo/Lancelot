export class Vector {

    _x;
    _y;

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
        this.set(num, this.y);
    }

    set y(num) {
        this.set(this.x, num);
    }

    set(x, y) {
        this._x = x;
        this._y = y;
    }

    copy(v1) {
        this.set(v1.x, v1.y);
        return this;
    }

    clone() {
        return new Vector(this.x, this.y);
    }

    add(v1) {
        this.set(this.x + v1.x, this.y + v1.y);
        return this;
    }

    sub(v1) {
        this.set(this.x - v1.x, this.y - v1.y);
        return this;
    }

    mult(s) {
        this.set(this.x * s, this.y * s);
        return this;
    }

    norm() {
        this.set(this.y, -this.x);
        return this;
    }

    unit() {
        const z = this.mag();
        if (z === 0) {
            return this;
        }
        this.set(this.x / z, this.y / z);
        return this;
    }

    mag() {
        return Math.hypot(this.x, this.y);
    }

    lerp(v1, alpha) {
        return this.add(v1.clone().sub(this).mult(alpha));
    }

    angle() {
        return Math.atan2(this.y, this.x);
    }

    rot(angle) {
        const sin =  Math.sin(angle);
        const cos = Math.cos(angle);
        const x = this.x * cos - this.y * sin;
        const y = this.x * sin + this.y * cos;
        this.set(x, y);
        return this;
    }

    static fromAngle(angle) {
        return new Vector(1, 0).rot(angle);
    }

    static dot(v1, v2) {
        return v1.x * v2.x + v1.y * v2.y;
    }

    static dist(v1, v2) {
        return v1.clone().sub(v2).mag();
    }

    static cross(v1, v2) {
        return v1.x * v2.y - v1.y * v2.x;
    }

    static angleBetween(v1, v2) {
        const z1 = v1.mag();
        const z2 = v2.mag();
        if (z1 === 0 || z2 === 0) {
            return 0;
        }
        return Math.acos(Vector.dot(v1, v2) / (z1 * z2));
    }
}

export class ParamVector extends Vector {
    
    _onChangeCallback;
    
    constructor(onChangeCallback, x = 0, y = 0) {
        super(x, y);
        this._onChangeCallback = onChangeCallback;
    }
    
    set(x, y) {
        if(x != this.x || y != this.y) {
            this._x = x;
            this._y = y;
            this._onChangeCallback();
        }
    }
}