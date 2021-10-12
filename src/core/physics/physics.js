import { Component } from "../component.js";
import { ParamParser } from "../utils/param-parser.js";
import { Vector } from "../utils/vector.js";

/*

position: Vector
velocity: Vector
mass: number
bounce: number
rotating: number
friction: { x: number, y: number }

*/

class Body extends Component {
    constructor(params) {
        super();
        this._type = "body";
        this._vel = new Vector();
        this._angVel = 0;
        this.mass = ParamParser.ParseValue(params.mass, 0);
        this.bounce = ParamParser.ParseValue(params.bounce, 0);
        this.angle = 0;
        this.rotating = ParamParser.ParseValue(params.rotating, 0);
        this.friction = ParamParser.ParseObject(params.friction, { x: 0, y: 0, angular: 0 });
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
    AddBehavior(group, type, action) {
        this._behavior.push({
            group: group,
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
        const gridController = this.GetComponent("SpatialGridController");
        const boundingRect = this.boundingRect;
        for(let behavior of this._behavior) {
            const entities = gridController.FindNearby(boundingRect.width, boundingRect.height).filter(e => e.groupList.has(behavior.group));;
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
}

export class Poly extends Body {
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
    GetFaceNormals(vertices) {
        const normals = [];
        const count = vertices.length;
        for(let i = 0; i < count; ++i) {
            const v1 = vertices[i];
            const v2 = vertices[(i + 1) % count];
            normals.push(v2.Clone().Sub(v1).Norm().Unit());
        }
        return normals;
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

    static FindSupportPoint(vertices, n, ptOnEdge){
        let max = -Infinity;
        let index =  -1;
        for(let i = 0; i < vertices.length; i++){
            let v = vertices[i].Clone().Sub(ptOnEdge);
            let proj = Vector.Dot(v, n);
            if(proj >= 0 && proj > max){
                max = proj;
                index = i;
            }
        }
        return { sp : vertices[index], depth : max, n: n };
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
    get inertia() {
        return (this._width ** 2 + this._height ** 2) / 6;
    }
}

export class Ball extends Body {
    constructor(params) {
        super(params);
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
    return {
        collide: false
    };
}

const DetectCollisionPolyVsPoly = (b1, b2) => {
    
    const verts1 = b1.GetComputedVertices();
    const verts2 = b2.GetComputedVertices();
    const normals1 = b1.GetFaceNormals(verts1);
    const normals2 = b2.GetFaceNormals(verts2);
    let e1SupportPoints = [];
    for(let i = 0; i < normals1.length; i++){
        let spInfo = Poly.FindSupportPoint(verts2, normals1[i].Mult(-1), verts1[i]);
        spInfo.n = normals1[i];
        e1SupportPoints[i] = spInfo;
        if(spInfo.sp == undefined) return { collide : false };
    }
    let e2SupportPoints = [];
    for(let i = 0; i < normals2.length; i++){
        let spInfo = Poly.FindSupportPoint(verts1, normals2[i], verts2[i]);
        spInfo.n = normals2[i];
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
    return {
        collide: false
    };
}

const ResolveCollision = (b1, b2) => {
    const detect = DetectCollision(b1, b2);
    
    if(detect.collide) {

        const diff = detect.normal.Clone().Mult(detect.depth / (b1.inverseMass + b2.inverseMass));
        b1.position.Add(diff.Clone().Mult(b1.inverseMass));
        b1.position.Sub(diff.Clone().Mult(b2.inverseMass));
        
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
        const j = (-(1 + bounce) * Vector.Dot(relVel, detect.normal)) / (b1.inverseMass + b2.inverseMass + (Vector.Cross(r1, detect.normal) ** 2) / b1.inertia + (Vector.Cross(r2, detect.normal)) / b2.inertia);
        const jn = detect.normal.Clone().Mult(j);

        b1._vel.Add(jn.Clone().Mult(b1.inverseMass));
        b1._vel.Sub(jn.Clone().Mult(b2.inverseMass));
        b1.angularVelocity += Vector.Cross(r1, jn.Clone().Mult(1 / b1.inertia));
        b2.angularVelocity -= Vector.Cross(r2, jn.Clone().Mult(1 / b2.inertia));

        return true;
    }
    return false;
}