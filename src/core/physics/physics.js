import { Component } from "../component.js";
import { ParamParser } from "../utils/param-parser.js";
import { Vector } from "../utils/vector.js";
import { SpatialHashGrid } from "../spatial-hash-grid.js";
import { SpatialGridController } from "../spatial-grid-controller.js";
import { QuadTree } from "../quadtree.js";
import { QuadtreeController } from "../quadtree-controller.js";

/*

position: Vector
velocity: Vector
mass: number
bounce: number
rotating: number
friction: { x: number, y: number }

*/

export class World {
    constructor(params = {}) {
        this._relaxationCount = ParamParser.ParseValue(params.iterations, 3);
        this._bounds = ParamParser.ParseValue(params.bounds, [[-1000, -1000], [1000, 1000]]);
        this._cellDimensions = ParamParser.ParseObject(params.cellDimensions, { width: 100, height: 100 });
        this._limit = ParamParser.ParseValue(params.limit, 10);
        this._bodies = [];
        this._joints = [];

        const cellCountX = Math.floor((this._bounds[1][0] - this._bounds[0][0]) / this._cellDimensions.width);
        const cellCountY = Math.floor((this._bounds[1][1] - this._bounds[0][1]) / this._cellDimensions.height);
        this._spatialGrid = new SpatialHashGrid(this._bounds, [cellCountX, cellCountY]);

        this._quadtree = new QuadTree(this._bounds, this._limit);
    }
    _AddJoint(j) {
        this._joints.push(j);
    }
    _AddBody(e, b) {
        e.body = b;
        const boundingRect = b.boundingRect;
        /*
        const gridController = new SpatialGridController({
            grid: this._spatialGrid,
            width: boundingRect.width,
            height: boundingRect.height
        });
        e.AddComponent(gridController);
        */
        const treeController = new QuadtreeController({
            quadtree: this._quadtree,
            width: boundingRect.width,
            height: boundingRect.height
        });
        e.AddComponent(treeController);
        
        this._bodies.push(b);
    }
    _RemoveBody(e, b) {
        /*
        const gridController = e.GetComponent("SpatialGridController");
        if(gridController) {
            this._spatialGrid.RemoveClient(gridController._client);
        }
        */

        const i = this._bodies.indexOf(b);
        if (i != -1) {
            this._bodies.splice(i, 1);
        }
    }
    Update(elapsedTimeS) {
        
        for(let body of this._bodies) {
            body._collisions.left.clear();
            body._collisions.right.clear();
            body._collisions.top.clear();
            body._collisions.bottom.clear();
            body._collisions.all.clear();
        }
        for(let body of this._bodies) {
            body.UpdatePosition(elapsedTimeS);
        }
        for(let joint of this._joints) {
            joint.Update(elapsedTimeS);
        }
        for(let i = 0; i < this._relaxationCount; ++i) {
            for(let body of this._bodies) {
                body.HandleBehavior();
            }
        }

        this._quadtree.Clear();
        
        for(let body of this._bodies) {
            const treeController = body.GetComponent("QuadtreeController");
            treeController.UpdateClient();
        }
        
    }
    
}

class Body extends Component {
    constructor(params) {
        super();
        this._type = "body";
        this._vel = new Vector();
        this.passiveVelocity = new Vector();
        this._angVel = 0;
        this.mass = ParamParser.ParseValue(params.mass, 0);
        this.bounce = ParamParser.ParseValue(params.bounce, 0);
        this.angle = 0;
        this.rotation = ParamParser.ParseValue(params.rotation, 1);
        this.friction = ParamParser.ParseObject(params.friction, { x: 0, y: 0, angular: 0, normal: 0 });
        this._behavior = [];
        this._collisions = {
            left: new Set(), right: new Set(), top: new Set(), bottom: new Set(), all: new Set()
        };
        this.options = ParamParser.ParseObject(params.options, {
            axes: { x: true, y: true },
            sides: { left: true, right: true, top: true, bottom: true }
        });
        this.followBottomObject = ParamParser.ParseValue(params.followBottomObject, false);
    }
    get velocity() {
        return this._vel;
    }
    set velocity(vec) {
        this._vel.Copy(vec);
    }
    get angularVelocity() {
        return this._angVel;
    }
    set angularVelocity(num) {
        this._angVel = num;
    }
    get inverseMass() {
        return this.mass === 0 ? 0 : 1 / this.mass;
    }
    get inertia() {
        return 0;
    }
    get boundingRect() {
        return { width: 0, height: 0 };
    }
    get collisions() {
        return this._collisions;
    }
    Draw(ctx) {
        const bb = this.boundingRect;
        ctx.beginPath();
        ctx.strokeStyle = "lime";
        ctx.strokeRect(-bb.width/2, -bb.height/2, bb.width, bb.height);
    }
    AddBehavior(groups, type, action) {
        this._behavior.push({
            groups: groups.split(" "),
            type: type,
            action: action
        });
    }
    UpdatePosition(elapsedTimeS) {
        const decceleration = 16;
        const frame_decceleration = new Vector(this._vel.x * this.friction.x * decceleration, this._vel.y * this.friction.y * decceleration);
        this._vel.Sub(frame_decceleration.Mult(elapsedTimeS));
        const vel = this._vel.Clone().Mult(elapsedTimeS);
        this.position.Add(vel);
        this.position.Add(this.passiveVelocity.Clone().Mult(elapsedTimeS));
        this.passiveVelocity.Set(0, 0);
        this._angVel -= this._angVel * this.friction.angular * decceleration * elapsedTimeS;
        this.angle += this._angVel * elapsedTimeS;
    }
    HandleBehavior() {
        // const controller = this.GetComponent("SpatialGridController");
        const controller = this.GetComponent("QuadtreeController");
        const boundingRect = this.boundingRect;
        for(let behavior of this._behavior) {
            const entities0 = controller.FindNearby(boundingRect.width, boundingRect.height);
            const entities = entities0.filter(e => {
                return behavior.groups.map((g) => e.groupList.has(g)).some(_ => _);
            });
            
            entities.sort((a, b) => {
                const boundingRectA = a.body.boundingRect;
                const boundingRectB = b.body.boundingRect;
                const distA = Vector.Dist(this.position, a.body.position) / new Vector(boundingRect.width + boundingRectA.width, boundingRect.height + boundingRectA.height).Mag();
                const distB = Vector.Dist(this.position, b.body.position) / new Vector(boundingRect.width + boundingRectB.width, boundingRect.height + boundingRectB.height).Mag();
                return distA - distB;
            });
            
            for(let e of entities) {
                let info;
                switch(behavior.type) {
                    case "DetectCollision":
                        info = DetectCollision(this, e.body);
                        
                        if(info.collide) {
                            if(behavior.action) {
                                behavior.action(e.body, info.point);
                            }
                        }
                        break;
                    case "ResolveCollision":
                        info = ResolveCollision(this, e.body);
                        if(info.collide) {
                            if(behavior.action) {
                                behavior.action(e.body, info.point);
                            }
                        }
                        break;
                }
            }
        }
    }
    Join(b, type, params = {}) {
        let joint;
        switch(type) {
            case "elastic":
                joint = new ElasticJoint(this, b, params);
                break;
            case "solid":
                joint = new SolidJoint(this, b, params);
                break;
        }
        if(!joint) {
            return;
        }
        const world = this.scene._world;
        world._AddJoint(joint);
    }
    Contains(p) {
        return false;
    }
    ApplyForce(v, point) {
        const rPoint = this.position.Clone().Sub(point);
        const vel = v.Clone().Mult(1 / this.inverseMass);
        this.velocity.Add(vel);
        this.angularVelocity += Vector.Cross(rPoint, vel.Clone().Mult(1 / this.inertia));
    }
}

class Poly extends Body {
    constructor(params) {
        super(params);
        this._points = params.points;
    }
    GetVertices() {
        return this._points.map((v) => new Vector(v[0], v[1]));
    }
    GetComputedVertices() {
        const verts = this.GetVertices();
        for(let i = 0; i < verts.length; ++i) {
            const v = verts[i];
            v.Rotate(this.angle);
            v.Add(this.position);
        }
        return verts;
    }
    get boundingRect() {

        const verts = this.GetVertices();
        let maxDist = 0;
        let idx = 0;
        for(let i = 0; i < verts.length; ++i) {
            const v = verts[i];
            const dist = v.Mag();
            if(dist > maxDist) {
                maxDist = dist;
                idx = i;
            }
        }
        const d = maxDist * 2;
        return {
            width: d,
            height: d
        }
    }

    static GetFaceNormals(vertices) {
        let normals = [];
        for(let i = 0; i < vertices.length; i++) {
            let v1 = vertices[i].Clone();
            let v2 = vertices[(i + 1) % vertices.length].Clone();
            normals[i] = v2.Clone().Sub(v1).Norm().Unit();
        }
        return normals;
    }

    static FindSupportPoint(vertices, n, ptOnEdge){
        let max = -Infinity;
        let index =  -1;
        for(let i = 0; i < vertices.length; i++){
            let v = vertices[i].Clone().Sub(ptOnEdge);
            let proj = Vector.Dot(v, n);
            if(proj > 0 && proj > max){
                max = proj;
                index = i;
            }
        }
        return { sp : vertices[index], depth : max };
    }
    Contains(p) {
        const verts = this.GetComputedVertices();
        const vertsLen = verts.length;
        let count = 0;
        for(let i = 0; i < vertsLen; ++i) {
            const v1 = verts[i];
            const v2 = verts[(i + 1) % vertsLen];
            if((p.y - v1.y) * (p.y - v2.y) <= 0 && (p.x <= v1.x || p.x <= v2.x) && (v1.x >= p.x && v2.x >= p.x || (v2.x - v1.x) * (p.y - v1.y) / (v2.y - v1.y) >= p.x - v1.x)) {
                ++count;
            }
        }
        return count % 2;
    }
}

export class Box extends Poly {
    constructor(params) {
        super(params);
        this._width = params.width;
        this._height = params.height;
        this._points = [
            [-this._width/2, -this._height/2],
            [this._width/2, -this._height/2],
            [this._width/2, this._height/2],
            [-this._width/2, this._height/2],
        ]
    }
    get width() {
        return this._width;
    }
    get height() {
        return this._height;
    }
    get inertia() {
        return ((this.width) ** 2 + (this.height) ** 2) / 2 / this.rotation;
    }
}

export class Ball extends Body {
    constructor(params) {
        super(params);
        this._radius = params.radius;
    }
    get radius() {
        return this._radius;
    }
    get boundingRect(){
        return { width : 2 * this.radius, height : 2 * this.radius };
    }
    get inertia() {
        return (Math.PI * this.radius ** 2) / 2 / this.rotation;
    }
    FindSupportPoint(n, ptOnEdge){
        let circVerts = [];
        
        circVerts[0] = this.position.Clone().Add(n.Clone().Mult(this.radius));
        circVerts[1] = this.position.Clone().Add(n.Clone().Mult(-this.radius));
        let max = -Infinity;
        let index = -1;
        for(let i = 0; i < circVerts.length; i++){
            let v = circVerts[i].Clone().Sub(ptOnEdge);
            let proj = Vector.Dot(v, n);
            if(proj > 0 && proj > max){
                max = proj;
                index = i;
            }
        }   
        return { sp : circVerts[index], depth : max, n : n };
    }
    FindNearestVertex(vertices){
        let dist = Infinity;
        let index = 0;
        for(let i = 0; i < vertices.length; i++){
            let l = Vector.Dist(vertices[i], this.position);
            if(l < dist){
                dist = l;
                index = i;
            }
        }
        return vertices[index];
    }
    Contains(p) {
        return Vector.Dist(p, this.position) <= this.radius;
    }
}

export class Polygon extends Poly {
    constructor(params) {
        super(params);
        this._radius = params.radius;
        this._sides = params.sides;
        const points = [];
        for(let i = 0; i < this._sides; ++i) {
            const angle = Math.PI * 2 / this._sides * i;
            points.push([Math.cos(angle) * this._radius, Math.sin(angle) * this._radius]);
        }
        this._points = points;
    }
    get radius() {
        return this._radius;
    }
    get boundingRect(){
        return { width : 2 * this.radius, height : 2 * this.radius };
    }
    get inertia() {
        return (Math.PI * this.radius ** 2) / 1 / this.rotation;
    }
}

export class Ray extends Body {
    constructor(params) {
        super(params);
        this._range = params.range;
    }
    get range() {
        return this._range;
    }
    set range(num) {
        this._range = num;
    }
    get boundingRect(){
        return { width : 2 * this.range, height : 2 * this.range };
    }
    get point() {
        return this.position.Clone().Add(new Vector(this.range, 0).Rotate(this.angle));
    }
}

const DetectCollision = (b1, b2) => {
    if(b1 instanceof Ball && b2 instanceof Ball) {
        return DetectCollisionBallVsBall(b1, b2);
    } else if(b1 instanceof Poly && b2 instanceof Poly) {
        return DetectCollisionPolyVsPoly(b1, b2);
    } else if(b1 instanceof Ball && b2 instanceof Poly) {
        return DetectCollisionBallVsPoly(b1, b2);
    } else if(b1 instanceof Poly && b2 instanceof Ball) {
        return DetectCollisionBallVsPoly(b2, b1);
    } else if(b1 instanceof Ray && b2 instanceof Poly) {
        return DetectCollisionRayVsPoly(b1, b2);
    } else if(b1 instanceof Poly && b2 instanceof Ray) {
        return DetectCollisionRayVsPoly(b2, b1);
    } else if(b1 instanceof Ray && b2 instanceof Ball) {
        return DetectCollisionRayVsBall(b1, b2);
    } else if(b1 instanceof Ball && b2 instanceof Ray) {
        return DetectCollisionRayVsBall(b2, b1);
    } else {
        return {
            collide: false
        }
    }
}

const DetectCollisionLineVsLine = (a, b, c, d) => {
    const r = b.Clone().Sub(a);
    const s = d.Clone().Sub(c);
    
    const den = r.x * s.y - r.y * s.x; 
	const u = ((c.x - a.x) * r.y - (c.y - a.y) * r.x) / den;
	const t = ((c.x - a.x) * s.y - (c.y - a.y) * s.x) / den;



    if((0 <= u && u <= 1 && 0 <= t && t <= 1)) {
        return {
            collide: true,
            point: a.Clone().Add(r.Clone().Mult(t))
        }
    }
    return {
        collide: false
    }
}

const DetectCollisionRayVsPoly = (ray, b) => {
    const rayPoint = ray.point;
    let minDist = Infinity;
    let point = null;
    const vertices = b.GetComputedVertices();
    for(let i = 0; i < vertices.length; ++i) {
        const v1 = vertices[i];
        const v2 = vertices[(i + 1) % vertices.length];
        const info = DetectCollisionLineVsLine(ray.position, rayPoint, v1, v2);
        if(info.collide) {
            const dist = Vector.Dist(ray.position, info.point);
            
            if(dist < minDist) {
                minDist = dist;
                point = info.point;
            }
        }
    }
    if(point != null) {
        ray._collisions.all.add(b);
        b._collisions.all.add(ray);
        return {
            collide: true,
            point: point
        };
    }
    return {
        collide: false
    };

}

const DetectCollisionRayVsBall = (ray, b) => {
    
    const rayPoint = ray.point;
    const rayVec = rayPoint.Clone().Sub(ray.position).Unit();
    const originToBall = b.position.Clone().Sub(ray.position);
    const r2 = b.radius ** 2;
    const originToBallLength2 = originToBall.Mag() ** 2;

    const a = Vector.Dot(originToBall, rayVec);
    const bsq = originToBallLength2 - a * a;

    if(r2 - bsq < 0) {
        return {
            collide: false
        };
    }

    const f = Math.sqrt(r2 - bsq);
    let t;
    if(originToBallLength2 < r2) {
        t = a + f;
    } else {
        t = a - f;
    }

    const point = ray.position.Clone().Add(rayVec.Clone().Mult(t));

    if(Vector.Dot(point.Clone().Sub(ray.position), rayPoint.Clone().Sub(ray.position)) < 0 || Vector.Dist(point, ray.position) > ray.range) {
        return {
            collide: false
        }
    }

    ray._collisions.all.add(b);
    b._collisions.all.add(ray);

    return {
        collide: true,
        point: point
    };
}

const DetectCollisionBallVsBall = (b1, b2) => {
    let v = b1.position.Clone().Sub(b2.position);
    let info = {};
    if(v.Mag() < b1.radius + b2.radius){
        info.normal = v.Clone().Unit();
        info.depth = b1.radius + b2.radius - v.Mag();
        info.point = b1.position.Clone().Add(info.normal.Clone().Mult(b1.radius));
        info.collide = true;
        b1._collisions.all.add(b2);
        b2._collisions.all.add(b1);
        return info;
    }
    return {
        collide: false,
    };
}

const DetectCollisionPolyVsPoly = (b1, b2) => {
    const verts1 = b1.GetComputedVertices();
    const verts2 = b2.GetComputedVertices();
    const normals1 = Poly.GetFaceNormals(verts1);
    const normals2 = Poly.GetFaceNormals(verts2);
    let e1SupportPoints = [];
    for(let i = 0; i < normals1.length; i++){
        let spInfo = Poly.FindSupportPoint(verts2, normals1[i].Clone().Mult(-1), verts1[i]);
        spInfo.n = normals1[i].Clone();
        e1SupportPoints[i] = spInfo;
        if(spInfo.sp == undefined) return { collide : false };
    }
    let e2SupportPoints = [];
    for(let i = 0; i < normals2.length; i++){
        let spInfo = Poly.FindSupportPoint(verts1, normals2[i].Clone().Mult(-1), verts2[i]);
        spInfo.n = normals2[i].Clone();
        e2SupportPoints[i] = spInfo;
        if(spInfo.sp == undefined) return { collide : false };
    }
    e1SupportPoints = e1SupportPoints.concat(e2SupportPoints);
    let max = Infinity;
    let index = 0;
    for(let i = 0; i < e1SupportPoints.length; i++){
        if(e1SupportPoints[i].depth < max){
            max = e1SupportPoints[i].depth;
            index = i;
        }
    }
    let v = b2.position.Clone().Sub(b1.position);
    if(Vector.Dot(v, e1SupportPoints[index].n) > 0){
        e1SupportPoints[index].n.Mult(-1);
    }
    b1._collisions.all.add(b2);
    b2._collisions.all.add(b1);
    return {
        collide: true,
        normal: e1SupportPoints[index].n,
        depth: e1SupportPoints[index].depth,
        point: e1SupportPoints[index].sp
    };
}

const DetectCollisionBallVsPoly = (b1, b2) => {
    const verts = b2.GetComputedVertices();
    const normals = Poly.GetFaceNormals(verts);
    let e1SupportPoints = [];
    for(let i = 0; i < normals.length; i++){
        let info = b1.FindSupportPoint(normals[i].Clone().Mult(-1), verts[i].Clone());
        if(info.sp == undefined) return { collide : false };
        e1SupportPoints[i] = info;
    }
    let nearestVertex = b1.FindNearestVertex(verts);
    let normal = b2.position.Clone().Sub(b1.position).Unit().Mult(-1);
    let info = Poly.FindSupportPoint(verts, normal.Clone(), b1.position.Clone().Add(normal.Clone().Mult(-b1.radius)));
    if(info.sp == undefined) return { collide : false };
    info.n = normal.Clone();
    e1SupportPoints.push(info);
    let max = Infinity;
    let index = 0;
    for(let i = 0; i < e1SupportPoints.length; i++){
        if(e1SupportPoints[i].depth < max){
            max = e1SupportPoints[i].depth;
            index = i;
        }
    }
    let v = b2.position.Clone().Sub(b1.position);
    if(Vector.Dot(v, e1SupportPoints[index].n) < 0){
        e1SupportPoints[index].n.Mult(-1);
    }
    b1._collisions.all.add(b2);
    b2._collisions.all.add(b1);
    return {
        collide: true,
        normal : e1SupportPoints[index].n,
        point : e1SupportPoints[index].sp,
        depth : e1SupportPoints[index].depth
    };
}

const ResolveCollision = (b1, b2) => {
    if(b1 instanceof Ball && b2 instanceof Poly) {
        [b1, b2] = [b2, b1];
    }
    const detect = DetectCollision(b1, b2);
    
    if(detect.collide) {
        const res = {
            collide: true,
            point: detect.point
        };
        if(b1.mass === 0 && b2.mass === 0) return res;

        if(!(b1.options.axes.x && b2.options.axes.x)) {
            detect.normal.x = 0;
        }
        if(!(b1.options.axes.y && b2.options.axes.y)) {
            detect.normal.y = 0;
        }

        const directions = {
            left: new Vector(-1, 0),
            right: new Vector(1, 0),
            top: new Vector(0, -1),
            bottom: new Vector(0, 1),
        };
        
        let direction;
        if (Vector.Dot(detect.normal, directions.left) >= Math.SQRT2 / 2) {
            direction = "left";
            
        } else if (Vector.Dot(detect.normal, directions.right) >= Math.SQRT2 / 2) {
            direction = "right";
            
        } else if (Vector.Dot(detect.normal, directions.top) >= Math.SQRT2 / 2) {
            direction = "top";
            
        } else if (Vector.Dot(detect.normal, directions.bottom) >= Math.SQRT2 / 2) {
            direction = "bottom";
            
        }

        const r1 = detect.point.Clone().Sub(b1.position);
        const r2 = detect.point.Clone().Sub(b2.position);
        const w1 = b1.angularVelocity;
        const w2 = b2.angularVelocity;
        const v1 = b1._vel;
        const v2 = b2._vel;
        const vp1 = v1.Clone().Add(new Vector(-w1 * r1.y, w1 * r1.x));
        const vp2 = v2.Clone().Add(new Vector(-w2 * r2.y, w2 * r2.x));
        const relVel = vp1.Clone().Sub(vp2);
        const bounce = b2.bounce;
        const j = (-(1 + bounce) * Vector.Dot(relVel, detect.normal)) / (b1.inverseMass + b2.inverseMass + Math.pow(Vector.Cross(r1, detect.normal), 2) / b1.inertia + Math.pow(Vector.Cross(r2, detect.normal), 2) / b2.inertia);
        const jn = detect.normal.Clone().Mult(j);
        const vel1 = jn.Clone().Mult(b1.inverseMass);
        const vel2 = jn.Clone().Mult(b2.inverseMass);


        const left = Vector.Dot(jn, directions.left),
        right = Vector.Dot(jn, directions.right),
        top = Vector.Dot(jn, directions.top),
        bottom = Vector.Dot(jn, directions.bottom);
        if((left >= Math.SQRT2 / 2 || (left < Math.SQRT2 / 2 && direction == "left")) && (!b1.options.sides.right || !b2.options.sides.left)) {
            return res;
        } else if((right >= Math.SQRT2 / 2 || (right < Math.SQRT2 / 2 && direction == "right")) && (!b1.options.sides.left || !b2.options.sides.right)) {
            return res;
        } else if((top >= Math.SQRT2 / 2 || (top < Math.SQRT2 / 2 && direction == "top")) && (!b1.options.sides.bottom || !b2.options.sides.top)) {
            return res;
        } else if((bottom >= Math.SQRT2 / 2 || (bottom < Math.SQRT2 / 2 && direction == "bottom")) && (!b1.options.sides.top || !b2.options.sides.bottom)) {
            return res;
        }


        
        const diff = detect.normal.Clone().Mult((detect.depth) / (b1.inverseMass + b2.inverseMass));
        b1.position.Add(diff.Clone().Mult(b1.inverseMass));
        b2.position.Sub(diff.Clone().Mult(b2.inverseMass)); 

        const relVelDotN = Vector.Dot(relVel, detect.normal);
        if (relVelDotN <= 0) {

            b1._vel.Add(vel1);
            b2._vel.Sub(vel2);
            b1.angularVelocity += Vector.Cross(r1, vel1.Clone().Mult(1 / b1.inertia));
            b2.angularVelocity -= Vector.Cross(r2, vel2.Clone().Mult(1 / b1.inertia));

            const friction = Math.max(b1.friction.normal, b2.friction.normal);
            const tangent = detect.normal.Clone().Norm();

            const j2 = (-(1 + bounce) * Vector.Dot(relVel, tangent) * friction) / (b1.inverseMass + b2.inverseMass + Math.pow(Vector.Cross(r1, tangent), 2) / b1.inertia + Math.pow(Vector.Cross(r2, tangent), 2) / b2.inertia);
            const jt = tangent.Clone().Mult(j2);
            const vel1a = jt.Clone().Mult(b1.inverseMass);
            const vel2a = jt.Clone().Mult(b2.inverseMass);
            b1._vel.Add(vel1a.Clone());
            b2._vel.Sub(vel2a.Clone());
            b1.angularVelocity += Vector.Cross(r1, vel1a.Clone().Mult(1 / b1.inertia));
            b2.angularVelocity -= Vector.Cross(r2, vel2a.Clone().Mult(1 / b2.inertia));

            switch (direction) {
                case "left":
                    b1._collisions.right.add(b2);
                    b2._collisions.left.add(b1);
                    break;
                case "right":
                    b1._collisions.left.add(b2);
                    b2._collisions.right.add(b1);
                    break;
                case "top":
                    b1._collisions.bottom.add(b2);
                    b2._collisions.top.add(b1);
                    break;
                case "bottom":
                    b1._collisions.top.add(b2);
                    b2._collisions.bottom.add(b1);
                    break;
            }

        }

        if(direction == "bottom") {
            if(b2.followBottomObject) b2.passiveVelocity.Copy(b1.velocity);
        } else if(direction == "top") {
            if(b1.followBottomObject) b1.passiveVelocity.Copy(b2.velocity);
        }
        

        return res;
    }
    return {
        collide: false
    };
}

class Joint {
    constructor(b1, b2, params) {
        this._body1 = b1;
        this._body2 = b2;
        const offset1 = ParamParser.ParseObject(params.offset1, { x: 0, y: 0 });
        this.offset1 = new Vector(offset1.x, offset1.y);
        const offset2 = ParamParser.ParseObject(params.offset2, { x: 0, y: 0 });
        this.offset2 = new Vector(offset2.x, offset2.y);

        const start = this._body1.position.Clone().Add(this.offset1.Clone().Rotate(this._body1.angle));
        const end = this._body2.position.Clone().Add(this.offset2.Clone().Rotate(this._body2.angle));
        this.length = ParamParser.ParseValue(params.length, Math.max(Vector.Dist(start, end), 1));
        this.strength = ParamParser.ParseValue(params.strength, 1);
    }
    Update(_) {}
}

class ElasticJoint extends Joint {
    constructor(b1, b2, params) {
        super(b1, b2, params);
    }
    Update(elapsedTimeS) {

        if(this._body1.mass === 0 && this._body2.mass === 0) return;

        const offset1 = this.offset1.Clone().Rotate(this._body1.angle);
        const offset2 = this.offset2.Clone().Rotate(this._body2.angle);
        const start = this._body1.position.Clone().Add(offset1);
        const end = this._body2.position.Clone().Add(offset2);

        const vec = start.Clone().Sub(end);
        const n = vec.Clone().Unit();
        const dist = vec.Mag();

        const relLenDiff = (dist - this.length) / this.length;

        const relVel = n.Clone().Mult(relLenDiff * -this.strength * 512 / (this._body1.inverseMass + this._body2.inverseMass));

        const vel1 = relVel.Clone().Mult(this._body1.inverseMass);
        this._body1.velocity.Add(vel1.Clone().Mult(elapsedTimeS));
        this._body1.angularVelocity += Vector.Cross(offset1, vel1.Clone().Mult(1 / this._body1.inertia)) * elapsedTimeS;

        const vel2 = relVel.Clone().Mult(this._body2.inverseMass);
        this._body2.velocity.Sub(vel2.Clone().Mult(elapsedTimeS));
        this._body2.angularVelocity -= Vector.Cross(offset2, vel2.Clone().Mult(1 / this._body2.inertia)) * elapsedTimeS;
        
    }
}

class SolidJoint extends Joint {
    constructor(b1, b2, params) {
        super(b1, b2, params);
    }
    Update(elapsedTimeS) {

        if(this._body1.mass === 0 && this._body2.mass === 0) return;

        const offset1 = this.offset1.Clone().Rotate(this._body1.angle);
        const offset2 = this.offset2.Clone().Rotate(this._body2.angle);
        const start = this._body1.position.Clone().Add(offset1);
        const end = this._body2.position.Clone().Add(offset2);

        const vec = start.Clone().Sub(end);
        const n = vec.Clone().Unit();
        const dist = vec.Mag();

        const repos = 16;
        const diff = n.Clone().Mult((dist - this.length) * -1 / (this._body1.inverseMass + this._body2.inverseMass));
        this._body1.position.Add(diff.Clone().Mult(this._body1.inverseMass * repos * elapsedTimeS));
        this._body2.position.Sub(diff.Clone().Mult(this._body2.inverseMass * repos * elapsedTimeS));

        const relLenDiff = (dist - this.length) / this.length;

        const relVel = n.Clone().Mult(relLenDiff * -this.strength * 512 / (this._body1.inverseMass + this._body2.inverseMass));

        const vel1 = relVel.Clone().Mult(this._body1.inverseMass);
        this._body1.velocity.Add(vel1.Clone().Mult(elapsedTimeS));
        this._body1.angularVelocity += Vector.Cross(offset1, vel1.Clone().Mult(1 / this._body1.inertia)) * elapsedTimeS;

        const vel2 = relVel.Clone().Mult(this._body2.inverseMass);
        this._body2.velocity.Sub(vel2.Clone().Mult(elapsedTimeS));
        this._body2.angularVelocity -= Vector.Cross(offset2, vel2.Clone().Mult(1 / this._body2.inertia)) * elapsedTimeS;

    }
}

