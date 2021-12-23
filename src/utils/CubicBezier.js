import { Vector } from "./Vector.js";

export class CubicBezier {

    constructor(x1, y1, x2, y2) {
        this.p0 = new Vector();
        this.p1 = new Vector(x1, y1);
        this.p2 = new Vector(x2, y2);
        this.p3 = new Vector(1, 1);
    }

    getValue(t) {
        return this.p0.clone().mult((1 - t) ** 3).add(this.p1.clone().mult(3 * (1 - t) ** 2 * t).add(this.p2.clone().mult(3 * (1 - t) * t ** 2)).add(this.p3.clone().mult(t ** 3))).y;
    }

    static fromKeyword(s) {
        let args;
        switch(s) {
            case "linear":
                args = [0, 0, 1, 1];
                break;
            case "ease":
                args = [0.25, 0.1, 0.25, 1.0];
                break;
            case "ease-in":
                args = [0.42, 0.0, 1.0, 1.0];
                break;
            case "ease-in-out":
                args = [0.42, 0.0, 0.58, 1.0];
                break;
            case "ease-out":
                args = [0.0, 0.0, 0.58, 1.0];
                break;
            default:
                args = [0, 0, 1, 1];
        }
        return new CubicBezier(...args);
    }

}