class AABB {
    /*
    params 
    x = client position.x,
    y = client position.y,
    width = client bounding width,
    height = client bounding height,
    userData = actual client
    */
    constructor(x, y, w, h, userData){
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        this.entity = userData;
    }
    //Collision detection AABB vs AABB
    _vsAabb(aabb){
        if(this.x + this.w/2 >= aabb.x - aabb.w/2 && 
           this.x - this.w/2 <= aabb.x + aabb.w/2 && 
           this.y + this.h/2 >= aabb.y - aabb.h/2 && 
           this.y - this.h/2 <= aabb.y + aabb.h/2){
            return true;
        }else{
            return false;
        }
    }
}

export class QuadTree{
    /*
    params
    aabb = (main / topmost / biggest) Quadtree AABB
    Limit = no of objects allowed in single quadtree before it split
    */

    constructor(bounds, limit){
        this._bounds = bounds;
        const w = bounds[1][0] - bounds[0][0];
        const h = bounds[1][1] - bounds[0][1];
        this.aabb = new AABB(bounds[0][0] + w / 2, bounds[0][1] + h / 2, w, h);
        this.limit = limit;
        this.divided = false;
        this.data = [];
    }

    // Divide quadtree if no of objects in quadtree more than its limit
    _divide(){
        const bounds = this._bounds;
        const w = bounds[1][0] - bounds[0][0];
        const h = bounds[1][1] - bounds[0][1];
        this.topLeft = new QuadTree([[bounds[0][0], bounds[0][1]], [bounds[0][0] + w / 2, bounds[0][1] + h / 2]], this.limit);
        this.topRight = new QuadTree([[bounds[0][0] + w / 2, bounds[0][1]], [bounds[0][0] + w, bounds[0][1] + h / 2]], this.limit);
        this.bottomLeft = new QuadTree([[bounds[0][0], bounds[0][1] + h / 2], [bounds[0][0] + w / 2, bounds[0][1] + h]], this.limit);
        this.bottomRight = new QuadTree([[bounds[0][0] + w / 2, bounds[0][1] + h / 2], [bounds[0][0] + w, bounds[0][1] + h]], this.limit);
        //Take points in that big undivided quadtree and put them into divided ones
        for(let i = 0; i < this.data.length; i++){
            this.topLeft._Insert(this.data[i]);
            this.topRight._Insert(this.data[i]);
            this.bottomLeft._Insert(this.data[i]);
            this.bottomRight._Insert(this.data[i]);
        }
        this.divided = true;
    }

    //Clears quadtree, to reinsert again
    Clear(){
        this.data = [];
        this.divided = false;
        this.topRight = null;
        this.topLeft = null;
        this.bottomLeft = null;
        this.bottomRight = null;
    }
    
    //Search quadtree within given aabb range
    //ignore res, that parameter not given by us
    FindNear(position, bounds) {
        const [w, h] = bounds;
        const [x, y] = position;
        const aabb = new AABB(x, y, w, h);
        const res = this._Search(aabb);
        return res == undefined ? [] : Array.from(res);
    }
    _Search(aabb, _res){
        
        if(_res == undefined){
            _res = new Set();
        } 
        if(!aabb._vsAabb(this.aabb)) return;
        if(!this.divided){
            for(let i = 0; i < this.data.length; i++){
                if(aabb._vsAabb(this.data[i])){
                    _res.add(this.data[i]);
                }
            }
        }else{
            this.topLeft._Search(aabb, _res);
            this.topRight._Search(aabb, _res);
            this.bottomLeft._Search(aabb, _res);
            this.bottomRight._Search(aabb, _res);
        }
        return _res;
    }

    NewClient(position, dimensions) {
        const aabb = new AABB(position[0], position[1], dimensions[0], dimensions[1]);
        this._Insert(aabb);
        return aabb;
    }
    //Insert aabb into tree
    _Insert(aabb, depth = 0){
        const maxRecursionDepth = 5;
        if(!this.aabb._vsAabb(aabb)){
            return false;
        }
        

        if(this.data.length < this.limit || depth > maxRecursionDepth){
            this.data.push(aabb);
            return true;
        }else{
            if(!this.divided){
                this._divide();
            }
            this.topLeft._Insert(aabb, depth + 1);
            this.topRight._Insert(aabb, depth + 1);
            this.bottomLeft._Insert(aabb, depth + 1);
            this.bottomRight._Insert(aabb, depth + 1);
        }
    }
    UpdateClient(aabb) {
        this._Insert(aabb);
    }
    Draw(ctx) {
        ctx.beginPath();
        ctx.save();
        ctx.strokeStyle = "white";
        ctx.strokeRect(this.aabb.x - this.aabb.w/2, this.aabb.y - this.aabb.h/2, this.aabb.w, this.aabb.h);
        ctx.restore();
        if(this.divided){ 
            this.topLeft.Draw(ctx); 
            this.topRight.Draw(ctx); 
            this.bottomLeft.Draw(ctx); 
            this.bottomRight.Draw(ctx); 
        } 
    }
}