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
                    if(typeof obj[attr] == "object") {
                        if(obj[attr].min !== undefined && obj[attr].max !== undefined) {
                            obj[attr] = this.ParseMinMax(data[attr], obj[attr]);
                        } else {
                            obj[attr] = this.ParseObject(data[attr], obj[attr]);
                        }
                    } else {
                        obj[attr] = this.ParseValue(data[attr], obj[attr]);
                    }
                }
            }
            return obj;
        },
        ParseMinMax(data, obj) {
            if(data === undefined) {
                return obj;
            }
            if(typeof data != "object") {
                return { min: data, max: data };
            }

            if (data.min !== undefined) {
                obj.min = data.min;
            }
            if (data.max !== undefined) {
                obj.max = data.max;
            }
            return obj;
        }
    }
})();