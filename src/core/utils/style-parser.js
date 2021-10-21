export const StyleParser = (function() {
    return {
        ParseStyle(ctx, s, obj, attr) {
            if(obj[attr]) {
                return obj[attr];
            }
            
            if(s == undefined) {
                obj[attr] = "black";
                return obj[attr];
            }
            const params = s.split(";");
            const len = params.length;
            if(len === 1) {
                obj[attr] = s;
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
            obj[attr] = grd;
            return grd;
        }
    }
})();