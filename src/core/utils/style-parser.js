export const StyleParser = (function() {
    return {
        ParseStyle(ctx, s) {
            if(s == undefined) {
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
                case "linear":
                    grd = ctx.createLinearGradient(...values);
                    break;
                case "radial":
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
})();