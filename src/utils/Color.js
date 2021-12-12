export class Color {

    /** @type {string} */
    _color;
    /** @type {(CanvasGradient | string)} */
    _parsed = null;

    constructor(col = "black") {
        this._color = col;
    }

    get alpha() {
        if(this._color == "transparent") {
            return 0;
        } else if(this._color.startsWith("rgba")) {
            return parseFloat(this._color.slice(5, this._color.length - 1).split(",")[3]);

        }
        return 1;
    }

    /**
     * 
     * @param {string} col 
     */
    set(col) {
        this._color = col;
        this._parsed = null;
    }

    /**
     * 
     * @param {CanvasRenderingContext2D} ctx 
     */
    fill(ctx) {
        ctx.fillStyle = this.get(ctx);
    }

    /**
     * 
     * @param {CanvasRenderingContext2D} ctx 
     */
    stroke(ctx) {
        ctx.strokeStyle = this.get(ctx);
    }

    get(ctx) {
        if(this._parsed == null) {
            this._parsed = Color.parse(ctx, this._color);
        }
        return this._parsed;
    }

    /**
     * 
     * @param {CanvasRenderingContext2D} ctx 
     * @param {string} s 
     * @returns {(CanvasGradient | string)}
     */
    static parse(ctx, s) {
        if(typeof s != "string") {
            return "black";
        }
        const params = s.split(";");
        const len = params.length;
        if(len === 1) {
            return s;
        }
        let grd;
        const values = params[1].split(",").map((s) => parseFloat(s));
        switch(params[0]) {
            case "linear-gradient":
                grd = ctx.createLinearGradient(...values);
                break;
            case "radial-gradient":
                grd = ctx.createRadialGradient(...values);
                break;
            default:
                return "black";
        }
        for(let i = 2; i < len; ++i) {
            const colorValuePair = params[i].split("=");
            grd.addColorStop(parseFloat(colorValuePair[1]), colorValuePair[0]);
        }
        return grd;
    }
}