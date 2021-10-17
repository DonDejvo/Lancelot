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
    constructor(params) {
        this._relaxationCount = ParamParser.ParseValue(params.relaxationCount, 5);
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
        const gridController = new SpatialGridController({
            grid: this._spatialGrid,
            width: boundingRect.width,
            height: boundingRect.height
        });
        e.AddComponent(gridController);
        const treeController = new QuadtreeController({
            quadtree: this._quadtree,
            width: boundingRect.width,
            height: boundingRect.height
        });
        e.AddComponent(treeController);
        
        this._bodies.push(b);
    }
    _RemoveBody(e, b) {
        const gridController = e.GetComponent("SpatialGridController");
        if(gridController) {
            this._spatialGrid.RemoveClient(gridController._client);
        }

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
        this._angVel = 0;
        this.mass = ParamParser.ParseValue(params.mass, 0);
        this.bounce = ParamParser.ParseValue(params.bounce, 0);
        this.angle = 0;
        this.rotating = ParamParser.ParseValue(params.rotating, 1);
        this.friction = ParamParser.ParseObject(params.friction, { x: 0, y: 0, angular: 0, collide: 0.3 });
        this._behavior = [];
        this._collisions = {
            left: new Set(), right: new Set(), top: new Set(), bottom: new Set()
        };
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
        const decceleration = 60;
        const frame_decceleration = new Vector(this._vel.x * this.friction.x * decceleration, this._vel.y * this.friction.y * decceleration);
        this._vel.Sub(frame_decceleration.Mult(elapsedTimeS));
        const vel = this._vel.Clone().Mult(elapsedTimeS);
        this.position.Add(vel);
        this._angVel -= this._angVel * this.friction.angular * decceleration * elapsedTimeS;
        this.angle += this._angVel * elapsedTimeS;
    }
    HandleBehavior() {
        // const controller = this.GetComponent("SpatialGridController");
        const controller = this.GetComponent("QuadtreeController");
        const boundingRect = this.boundingRect;
        for(let behavior of this._behavior) {
            const entites0 = controller.FindNearby(boundingRect.width, boundingRect.height);
            const entities = entites0.filter(e => {
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
                switch(behavior.type) {
                    case "detect":
                        if(DetectCollision(this, e.body).collide) {
                            if(behavior.action) {
                                behavior.action(e.body);
                            }
                        }
                        break;
                    case "resolve":
                        if(ResolveCollision(this, e.body)) {
                            if(behavior.action) {
                                behavior.action(e.body);
                            }
                        }
                        break;
                }
            }
        }
    }
    Join(b, type, params) {
        let joint;
        switch(type) {
            case "spring":
                joint = new Spring(this, b, params);
                break;
            case "stick":
                joint = new Stick(this, b, params);
                break;
        }
        if(!joint) {
            return;
        }
        const world = this.scene._world;
        world._AddJoint(joint);
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
        return ((this.width) ** 2 + (this.height) ** 2) / 1 / this.rotating;
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
        return (Math.PI * this.radius ** 2) / 1 / this.rotating;
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
}

export class RegularPolygon extends Poly {
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
        return (Math.PI * this.radius ** 2) / 1 / this.rotating;
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
    } else {
        return {
            collide: false
        }
    }
}

const DetectCollisionBallVsBall = (b1, b2) => {
    let v = b1.position.Clone().Sub(b2.position);
    let info = {};
    if(v.Mag() < b1.radius + b2.radius){
        info.normal = v.Clone().Unit();
        info.depth = b1.radius + b2.radius - v.Mag();
        info.point = b1.position.Clone().Add(info.normal.Clone().Mult(b1.radius));
        info.collide = true;
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
    let normal = nearestVertex.Clone().Sub(b1.position).Unit();
    let info = Poly.FindSupportPoint(verts, normal.Clone(), b1.position.Clone());
    if(info.sp == undefined) return { collide : false };
    info.n = normal.Clone();
    e1SupportPoints.push(info);
    let max = Infinity;
    let index = null;
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
    return {
        collide: true,
        normal : e1SupportPoints[index].n,
        point : e1SupportPoints[index].sp,
        depth : e1SupportPoints[index].depth
    };
}

const ResolveCollision = (b1, b2, elapsedTimeS) => {
    if(b1 instanceof Ball && b2 instanceof Poly) {
        [b1, b2] = [b2, b1];
    }
    const detect = DetectCollision(b1, b2);
    
    if(detect.collide) {
        if(b1.mass === 0 && b2.mass === 0) return true;

        const diff = detect.normal.Clone().Mult((detect.depth) / (b1.inverseMass + b2.inverseMass));
        b1.position.Add(diff.Clone().Mult(b1.inverseMass));
        b2.position.Sub(diff.Clone().Mult(b2.inverseMass)); 

        const r1 = detect.point.Clone().Sub(b1.position);
        const r2 = detect.point.Clone().Sub(b2.position);
        const w1 = b1.angularVelocity;
        const w2 = b2.angularVelocity;
        const v1 = b1._vel;
        const v2 = b2._vel;
        const vp1 = v1.Clone().Add(new Vector(-w1 * r1.y, w1 * r1.x));
        const vp2 = v2.Clone().Add(new Vector(-w2 * r2.y, w2 * r2.x));
        const relVel = vp1.Clone().Sub(vp2);
        const bounce = Math.max(b1.bounce, b2.bounce);

        const relVelDotN = Vector.Dot(relVel, detect.normal);
        if(relVelDotN > 0) return true;

        const j = (-(1 + bounce) * Vector.Dot(relVel, detect.normal)) / (b1.inverseMass + b2.inverseMass + Math.pow(Vector.Cross(r1, detect.normal), 2) / b1.inertia + Math.pow(Vector.Cross(r2, detect.normal), 2) / b2.inertia);
        const jn = detect.normal.Clone().Mult(j);
        const vel1 = jn.Clone().Mult(b1.inverseMass);
        const vel2 = jn.Clone().Mult(b2.inverseMass);
        b1._vel.Add(vel1.Clone().Mult(1));
        b2._vel.Sub(vel2.Clone().Mult(1));
        b1.angularVelocity += Vector.Cross(r1, vel1.Clone().Mult(1 / b1.inertia));
        b2.angularVelocity -= Vector.Cross(r2, vel2.Clone().Mult(1 / b1.inertia));
        
        const friction = Math.max(b1.friction.collide, b2.friction.collide);
        const tangent = detect.normal.Clone().Norm();

        const j2 = (-(1 + bounce) * Vector.Dot(relVel, tangent) * friction) / (b1.inverseMass + b2.inverseMass + Math.pow(Vector.Cross(r1, tangent), 2) / b1.inertia + Math.pow(Vector.Cross(r2, tangent), 2) / b2.inertia);
        const jt = tangent.Clone().Mult(j2);
        const vel1a = jt.Clone().Mult(b1.inverseMass);
        const vel2a = jt.Clone().Mult(b2.inverseMass);
        b1._vel.Add(vel1a.Clone());
        b2._vel.Sub(vel2a.Clone());
        b1.angularVelocity += Vector.Cross(r1, vel1a.Clone().Mult(1 / b1.inertia));
        b2.angularVelocity -= Vector.Cross(r2, vel2a.Clone().Mult(1 / b2.inertia));
        

        return true;
    }
    return false;
}

class Joint {
    constructor(b1, b2, params) {
        this._body1 = b1;
        this._body2 = b2;
        const offset1 = ParamParser.ParseObject(params.offset1, { x: 0, y: 0 });
        this._offset1 = new Vector(offset1.x, offset1.y);
        const offset2 = ParamParser.ParseObject(params.offset2, { x: 0, y: 0 });
        this._offset2 = new Vector(offset2.x, offset2.y);

        const start = this._body1.position.Clone().Add(this._offset1.Clone().Rotate(this._body1.angle));
        const end = this._body2.position.Clone().Add(this._offset2.Clone().Rotate(this._body2.angle));
        this._length = ParamParser.ParseValue(params.length, Vector.Dist(start, end));
    }
    Update(_) {}
}

class Spring extends Joint {
    constructor(b1, b2, params) {
        super(b1, b2, params);
        this._stiffness = ParamParser.ParseValue(params.stiffness, 0) * 10;
    }
    Update() {
        const offset1 = this._offset1.Clone().Rotate(this._body1.angle);
        const offset2 = this._offset2.Clone().Rotate(this._body2.angle);
        const start = this._body1.position.Clone().Add(offset1);
        const end = this._body2.position.Clone().Add(offset2);

        const vec = start.Clone().Sub(end);
        const n = vec.Clone().Unit();
        const dist = vec.Mag();

        const diff = n.Clone().Mult((dist - this._length) * -this._stiffness / (this._body1.inverseMass + this._body2.inverseMass));
        
        const vel1 = diff.Clone().Mult(this._body1.inverseMass);
        this._body1.velocity.Add(vel1.Clone().Mult(1));
        this._body1.angularVelocity += Vector.Cross(offset1, vel1.Clone().Mult(1 / this._body1.inertia));

        const vel2 = diff.Clone().Mult(this._body2.inverseMass);
        this._body2.velocity.Sub(vel2.Clone().Mult(1));
        this._body2.angularVelocity -= Vector.Cross(offset2, vel2.Clone().Mult(1 / this._body2.inertia));

    }
}

class Stick extends Joint {
    constructor(b1, b2, params) {
        super(b1, b2, params);

    }
    Update() {
        const offset1 = this._offset1.Clone().Rotate(this._body1.angle);
        const offset2 = this._offset2.Clone().Rotate(this._body2.angle);
        const start = this._body1.position.Clone().Add(offset1);
        const end = this._body2.position.Clone().Add(offset2);

        const vec = start.Clone().Sub(end);
        const n = vec.Clone().Unit();
        const dist = vec.Mag();

        const diff = n.Clone().Mult((dist - this._length) * -this._stiffness / (this._body1.inverseMass + this._body2.inverseMass));

    }
}

