export const ParamParser = (function() {
    return {
        ParseValue(data, val) {
            if(data != undefined && typeof data == typeof val) {
                return data;
            }
            return val;
        },
        ParseObject(data, obj) {
            if(data) {
                for(let attr in obj) {
                    obj[attr] = typeof obj[attr] == "object" ? this.ParseObject(data[attr], obj[attr]) : this.ParseValue(data[attr], obj[attr]);
                }
            }
            return obj;
        }
    }
})();