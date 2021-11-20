class AABB {
    
    constructor(x, y, w, h, userData = null) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        this.entity = userData;
    }
    
    _vsAabb(aabb){
        if(this.x + this.w / 2 >= aabb.x - aabb.w / 2 && 
           this.x - this.w / 2 <= aabb.x + aabb.w  /2 && 
           this.y + this.h / 2 >= aabb.y - aabb.h / 2 && 
           this.y - this.h / 2 <= aabb.y + aabb.h / 2) {
            return true;
        } else {
            return false;
        }
    }
}

export class QuadTree {

    _bounds;
    _limit;
    /** @type {AABB} */
    _aabb;
    _divided = false;
    /** @type {AABB[]} */
    _data = [];
    /** @type {QuadTree} */
    _topLeft = null;
    /** @type {QuadTree} */
    _topRight = null;
    /** @type {QuadTree} */
    _bottomLeft = null;
    /** @type {QuadTree} */
    _bottomRight = null;
    _maxRecursionDepth = 5;

    /**
     * 
     * @param {number[][]} bounds 
     * @param {number} limit 
     */

    constructor(bounds, limit){
        this._bounds = bounds;
        const w = bounds[1][0] - bounds[0][0];
        const h = bounds[1][1] - bounds[0][1];
        this._aabb = new AABB(bounds[0][0] + w / 2, bounds[0][1] + h / 2, w, h);
        this._limit = limit;
    }

    newClient(position, dimensions) {
        const aabb = new AABB(position[0], position[1], dimensions[0], dimensions[1]);
        this._insert(aabb);
        return aabb;
    }

    updateClient(aabb) {
        this._insert(aabb);
    }

    findNear(position, bounds) {
        const [w, h] = bounds;
        const [x, y] = position;
        const aabb = new AABB(x, y, w, h);
        const res = this._search(aabb);
        return res == undefined ? [] : Array.from(res);
    }

    clear() {
        this._data = [];
        this._divided = false;
        this._topRight = null;
        this._topLeft = null;
        this._bottomLeft = null;
        this._bottomRight = null;
    }
    
    draw(ctx) {
        ctx.beginPath();
        ctx.strokeStyle = "white";
        ctx.strokeRect(this._aabb.x - this._aabb.w / 2, this._aabb.y - this._aabb.h / 2, this._aabb.w, this._aabb.h);
        if (this._divided) { 
            this._topLeft.draw(ctx); 
            this._topRight.draw(ctx); 
            this._bottomLeft.draw(ctx); 
            this._bottomRight.draw(ctx); 
        } 
    }

    _divide() {
        const bounds = this._bounds;
        const w = bounds[1][0] - bounds[0][0];
        const h = bounds[1][1] - bounds[0][1];
        this._topLeft = new QuadTree([[bounds[0][0], bounds[0][1]], [bounds[0][0] + w / 2, bounds[0][1] + h / 2]], this.limit);
        this._topRight = new QuadTree([[bounds[0][0] + w / 2, bounds[0][1]], [bounds[0][0] + w, bounds[0][1] + h / 2]], this.limit);
        this._bottomLeft = new QuadTree([[bounds[0][0], bounds[0][1] + h / 2], [bounds[0][0] + w / 2, bounds[0][1] + h]], this.limit);
        this._bottomRight = new QuadTree([[bounds[0][0] + w / 2, bounds[0][1] + h / 2], [bounds[0][0] + w, bounds[0][1] + h]], this.limit);
        
        for(let data of this._data){
            this._topLeft._insert(data);
            this._topRight._insert(data);
            this._bottomLeft._insert(data);
            this._bottomRight._insert(data);
        }
        this.divided = true;
    }

    _search(aabb, res){
        
        if(res == undefined){
            res = new Set();
        } 
        if(!aabb._vsAabb(this._aabb)) return;
        if(!this._divided){
            for(let data of this._data) {
                if(aabb._vsAabb(data)) {
                    res.add(data);
                }
            }
        }else{
            this._topLeft._search(aabb, res);
            this._topRight._search(aabb, res);
            this._bottomLeft._search(aabb, res);
            this._bottomRight._search(aabb, res);
        }
        return res;
    }

    _insert(aabb, depth = 0){
        if (!this._aabb._vsAabb(aabb)) {
            return false;
        }
        

        if (this._data.length < this._limit || depth > this._maxRecursionDepth) {
            this._data.push(aabb);
            return true;
        } else {
            if (!this._divided) {
                this._divide();
            }
            this._topLeft._insert(aabb, depth + 1);
            this._topRight._insert(aabb, depth + 1);
            this._bottomLeft._insert(aabb, depth + 1);
            this._bottomRight._insert(aabb, depth + 1);
        }
    }

}