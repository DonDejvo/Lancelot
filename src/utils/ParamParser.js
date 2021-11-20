export const paramParser = (function() {
    return {
        parseValue(data, val) {
            if(data !== undefined && (typeof data == typeof val || val === null)) {
                return data;
            }
            return val;
        },
        parseObject(data, obj) {
            if(data) {
                for(let attr in obj) {
                    obj[attr] = (typeof obj[attr] == "object" && !Array.isArray(obj[attr]) && obj[attr] !== null) ? this.parseObject(data[attr], obj[attr]) : this.parseValue(data[attr], obj[attr]);
                    if(typeof obj[attr] == "object" && !Array.isArray(obj[attr]) && obj[attr] !== null) {
                        if(obj[attr].min !== undefined && obj[attr].max !== undefined) {
                            obj[attr] = this.parseMinMax(data[attr], obj[attr]);
                        } else {
                            obj[attr] = this.parseObject(data[attr], obj[attr]);
                        }
                    } else {
                        obj[attr] = this.parseValue(data[attr], obj[attr]);
                    }
                }
            }
            return obj;
        },
        parseMinMax(data, obj) {
            if(data === undefined) {
                return obj;
            }
            if(typeof data == "number") {
                return { min: data, max: data };
            }

            if (typeof data == "object" && !Array.isArray(data) && data !== null) {
                let min, max;
                if (typeof data.min == "number" && data.min <= obj.max) {
                    min = data.min;
                } else {
                    min = obj.min;
                }
                if (typeof data.max == "number" && data.max >= obj.min) {
                    max = data.max;
                } else {
                    max = obj.max;
                }
                if (min <= max) {
                    return { min: min, max: max };
                }
            }
            return obj;
        }
    }
})();