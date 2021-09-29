export class Vector {
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }
    Copy(v1) {
        this.x = v1.x;
        this.y = v1.y;
    }
    Clone() {
        return new Vector(this.x, this.y);
    }
    Add(v1) {
        this.x += v1.x;
        this.y += v1.y;
        return this;
    }
    Sub(v1) {
        this.x -= v1.x;
        this.y -= v1.y;
        return this;
    }
    Mult(s) {
        this.x *= s;
        this.y *= s;
        return this;
    }
    Norm() {
        [this.x, this.y] = [this.y, -this.x];
        return this;
    }
    Unit() {
        const z = this.Mag();
        if (z === 0) {
            return this;
        }
        this.x /= z;
        this.y /= z;
        return this;
    }
    Mag() {
        return Math.sqrt(Math.pow(this.x, 2) + Math.pow(this.y, 2));
    }
    Lerp(v1, alpha) {
        this.Add(v1.Clone().Sub(this).Mult(alpha));
        return this;
    }
    Angle() {
        return Math.atan2(this.y, this.x);
    }
    Rotate(angle) {
        const x = this.x * Math.cos(angle) - this.y * Math.sin(angle);
        const y = this.x * Math.sin(angle) + this.y * Math.cos(angle);
        this.x = x;
        this.y = y;
        return this;
    }
    static Dot(v1, v2) {
        return v1.x * v2.x + v1.y * v2.y;
    }
    static Dist(v1, v2) {
        return Math.sqrt(Math.pow((v1.x - v2.x), 2) + Math.pow((v1.y - v2.y), 2));
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