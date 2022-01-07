export class Color {

    _value;
    _str;

    constructor(str = "black") {
        this.set(str);
    }

    get value() {
        return this._value;
    }

    get alpha() {
        if(this._str == "transparent") {
            return 0.0;
        } else if(this._str.startsWith("rgba")) {
            return parseFloat(this._str.slice(5, this._str.length - 1).split(",")[3]);

        }
        return 1.0;
    }

    set(str) {
        this._str = str;
        this._value = Color.parse(str);
    }

    copy(col) {
        this._str = col._str;
        this._value = col._value;
    }

    static parse(str) {
        const ctx = Color._buffer;
        if(typeof str != "string") {
            return "black";
        }
        const params = str.split(";");
        const len = params.length;
        if(len === 1) {
            return str;
        }
        let grd;
        const values = params[1].split(",").map((val) => parseFloat(val));
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

    static _buffer = document.createElement("canvas").getContext("2d");
}