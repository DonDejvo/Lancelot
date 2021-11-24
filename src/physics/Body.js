import { paramParser } from "../utils/ParamParser.js";
import { Vector } from "../utils/Vector.js";
import { Component } from "../core/Component.js";
import { math } from "../utils/Math.js";
import { SolidJoint, ElasticJoint } from "./Joint.js";

export class Body extends Component {

    _vel = new Vector();
    _angVel = 0;
    _passiveVel = new Vector();
    _behavior = [];
    _friction;
    _mass;
    _rotation;
    _collisions = {
        left: new Set(), right: new Set(), top: new Set(), bottom: new Set(), all: new Set()
    };
    _options;
    _followBottomObject;
    _resized = false;
    _behaviorIds = 0;
    _joints = [];
    
    constructor(params) {
        super();
        this._type = "body";
        this._friction = paramParser.parseObject(params.friction, { x: 0, y: 0, angular: 0 });
        this._mass = paramParser.parseValue(params.mass, 0);
        this._rotation = paramParser.parseValue(params.rotation, 0);
        this._options = paramParser.parseObject(params.options, {
            axes: { x: true, y: true },
            sides: { left: true, right: true, top: true, bottom: true }
        });
        this._followBottomObject = paramParser.parseValue(params.followBottomObject, false);
    }

    get velocity() {
        return this._vel;
    }

    set velocity(vec) {
        this._vel.copy(vec);
    }

    get angularVelocity() {
        return this._angVel;
    }

    set angularVelocity(num) {
        this._angVel = num;
    }

    get mass() {
        return this._mass;
    }

    set mass(val) {
        this._mass = Math.max(val, 0);
    }

    get friction() {
        return this._friction;
    }

    get rotation() {
        return this._rotation;
    }

    set rotation(val) {
        this._rotation = val;
    }

    get inverseMass() {
        return this._mass === 0 ? 0 : 1 / this._mass;
    }

    get inertia() {
        return 0;
    }

    get collisions() {
        return this._collisions;
    }

    get options() {
        return this._options;
    }

    get followBottomObject() {
        return this._followBottomObject;
    }

    set followBottomObject(val) {
        this._followBottomObject = val;
    }

    get passiveVelocity() {
        return this._passiveVel;
    }

    set passiveVelocity(v) {
        this._passiveVel.copy(v);
    }

    initComponent() {
        this.scene.addBody(this.parent, this);
    }

    getBoundingRect() {
        return {
            width: 0,
            height: 0
        };
    }

    addBehavior(groups, type, options, name) {
        if (name === undefined) {
            name = this._generateBehaviorName();
        }
        this._behavior.push({
            groups: groups.split(" "),
            type: type,
            options: paramParser.parseObject(options, {
                bounce: 0.0,
                friction: 0.0,
                action: null
            }),
            name: name
        });

    }

    removeBehavior(name) {
        const idx = this._behavior.findIndex((e) => e.name == name);
        if(idx != -1) {
            this._behavior.splice(idx, 1);
        }
    }

    updateBehavior(name, options = {}) {
        const behavior = this._behavior.find((e) => e.name == name);
        if(behavior) {
            for(let attr in options) {
                behavior.options[attr] = options[attr];
            }
        }
    }

    join(body, type, params) {
        if(params === undefined) {
            params = {};
        }
        let joint;
        switch(type) {
            case "elastic":
                joint = new ElasticJoint(this, body, params);
                break;
            case "solid":
                joint = new SolidJoint(this, body, params);
                break;
        }
        if(!joint) {
            return null;
        }
        const world = this.scene.world;
        world._addJoint(joint);
        this._joints.push(joint);
        body._joints.push(joint);
        return joint;
    }

    contains(v) {
        return false;
    }

    applyForce(v, point) {
        const rPoint = point.clone().sub(this.position);
        const vel = v.clone().mult(this.inverseMass);
        this.velocity.add(vel);
        this.angularVelocity += Vector.cross(rPoint, vel.clone().mult(1 / this.inertia));
    }

    updatePosition(elapsedTimeS) {
        const decceleration = 30;
        const frame_decceleration = new Vector(this._vel.x * this._friction.x * decceleration, this._vel.y * this._friction.y * decceleration);
        this._vel.sub(frame_decceleration.mult(elapsedTimeS));
        const vel = this._vel.clone().mult(elapsedTimeS);
        this.position.add(vel);
        this.position.add(this._passiveVel.clone().mult(elapsedTimeS));
        this._passiveVel.set(0, 0);
        this._angVel -= this._angVel * this._friction.angular * decceleration * elapsedTimeS;
        this.angle += this._angVel * elapsedTimeS;
    }

    handleBehavior() {
        const controller = this.getComponent("QuadtreeController");
        const boundingRect = this.getBoundingRect();
        for(let behavior of this._behavior) {
            const entities = controller.findNearby(boundingRect.width, boundingRect.height).filter(e => {
                return behavior.groups.map((g) => e.groupList.has(g)).some(_ => _);
            });

            
            entities.sort((a, b) => {
                const boundingRectA = a.body.getBoundingRect();
                const boundingRectB = b.body.getBoundingRect();
                const distA = Vector.dist(this.position, a.body.position) / new Vector(boundingRect.width + boundingRectA.width, boundingRect.height + boundingRectA.height).mag();
                const distB = Vector.dist(this.position, b.body.position) / new Vector(boundingRect.width + boundingRectB.width, boundingRect.height + boundingRectB.height).mag();
                return distA - distB;
            });
            
            
            for(let e of entities) {
                let info;
                switch(behavior.type) {
                    case "detect":
                        info = detectCollision(this, e.body);
                        
                        if(info.collide) {
                            if(behavior.options.action) {
                                behavior.options.action(e.body, info.point);
                            }
                        }
                        break;
                    case "resolve":
                        info = resolveCollision(this, e.body, behavior.options);
                        if(info.collide) {
                            if(behavior.options.action) {
                                behavior.options.action(e.body, info.point);
                            }
                        }
                        break;
                }
            }
        }
    }

    draw(ctx) {
        const rect = this.getBoundingRect();
        ctx.beginPath();
        ctx.strokeStyle = "white";
        ctx.strokeRect(this.position.x - rect.width / 2, this.position.y - rect.height / 2, rect.width, rect.height);
    }

    _generateBehaviorName() {
        ++this._behaviorIds;
        return "__behavior__" + this._behaviorIds;
    }

}

export class Polygon extends Body {

    _points;

    constructor(params) {
        super(params);
        this._points = params.points;
    }

    get inertia() {
        let maxDist = 0;
        for(let i = 0; i < verts.length; ++i) {
            const v = verts[i];
            const dist = v.mag();
            if(dist > maxDist) {
                maxDist = dist;
            }
        }
        return (Math.PI * maxDist ** 2) * 0.5 / this.rotation;
    }

    getBoundingRect() {

        const verts = this._getVertices();
        let maxDist = 0;
        for(let i = 0; i < verts.length; ++i) {
            const v = verts[i];
            const dist = v.mag();
            if(dist > maxDist) {
                maxDist = dist;
            }
        }
        const d = maxDist * 2;
        return {
            width: d,
            height: d
        }
    }

    contains(p) {
        const verts = this.getComputedVertices();
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

    getComputedVertices() {
        const verts = this._getVertices();
        for(let i = 0; i < verts.length; ++i) {
            const v = verts[i];
            v.rot(this.angle);
            v.add(this.position);
        }
        return verts;
    }

    _getVertices() {
        return this._points.map((v) => new Vector(v[0], v[1]));
    }

    static getFaceNormals(vertices) {
        let normals = [];
        for(let i = 0; i < vertices.length; i++) {
            let v1 = vertices[i].clone();
            let v2 = vertices[(i + 1) % vertices.length].clone();
            normals[i] = v2.clone().sub(v1).norm().unit();
        }
        return normals;
    }

    static findSupportPoint(vertices, n, ptOnEdge){
        let max = -Infinity;
        let index =  -1;
        for(let i = 0; i < vertices.length; i++){
            let v = vertices[i].clone().sub(ptOnEdge);
            let proj = Vector.dot(v, n);
            if(proj > 0 && proj > max){
                max = proj;
                index = i;
            }
        }
        return { sp : vertices[index], depth : max };
    }
}

export class Box extends Polygon {

    _width;
    _height;

    constructor(params) {
        super(params);
        this._width = params.width;
        this._height = params.height;
        this._initPoints();
    }

    get width() {
        return this._width;
    }

    get height() {
        return this._height;
    }

    set width(val) {
        this._width = Math.max(val, 0);
        this._initPoints();
    }

    set height(val) {
        this._height = Math.max(val, 0);
        this._initPoints();
    }

    get inertia() {
        return (this.width ** 2 + this.height ** 2) * 0.1 / this.rotation;
    }

    _initPoints() {
        this._points = [
            [-this._width/2, -this._height/2],
            [this._width/2, -this._height/2],
            [this._width/2, this._height/2],
            [-this._width/2, this._height/2],
        ];
        this._resized = true;
    }
}

export class RegularPolygon extends Polygon {

    _radius;
    _sides;

    constructor(params) {
        super(params);
        this._radius = params.radius;
        this._sides = params.sides;
        this._initPoints();
    }

    get radius() {
        return this._radius;
    }

    set radius(val) {
        this._radius = Math.max(val, 0);
        this._initPoints();
    }

    get sides() {
        return this._sides;
    }

    set sides(val) {
        this._sides = Math.max(val, 3);
        this._initPoints();
    }

    get inertia() {
        return (Math.PI * this.radius ** 2) * 0.2 / this.rotation;
    }

    getBoundingRect() {
        return { width : 2 * this.radius, height : 2 * this.radius };
    }

    _initPoints() {
        const points = [];
        for(let i = 0; i < this._sides; ++i) {
            const angle = Math.PI * 2 / this._sides * i;
            points.push([Math.cos(angle) * this._radius, Math.sin(angle) * this._radius]);
        }
        this._points = points;
        this._resized = true;
    }
}

export class Ball extends Body {

    _radius;

    constructor(params) {
        super(params);
        this._radius = params.radius;
    }


    get radius() {
        return this._radius;
    }

    set radius(val) {
        this._radius = Math.max(val, 0);
        this._resized = true;
    }

    get inertia() {
        return (Math.PI * this.radius ** 2) * 0.4 / this.rotation;
    }

    getBoundingRect(){
        return { width : 2 * this.radius, height : 2 * this.radius };
    }

    findSupportPoint(n, ptOnEdge) {
        let circVerts = [];
        
        circVerts[0] = this.position.clone().add(n.clone().mult(this.radius));
        circVerts[1] = this.position.clone().add(n.clone().mult(-this.radius));
        let max = -Infinity;
        let index = -1;
        for(let i = 0; i < circVerts.length; i++){
            let v = circVerts[i].clone().sub(ptOnEdge);
            let proj = Vector.dot(v, n);
            if(proj > 0 && proj > max){
                max = proj;
                index = i;
            }
        }   
        return { sp : circVerts[index], depth : max, n : n };
    }

    findNearestVertex(vertices) {
        let dist = Infinity;
        let index = 0;
        for(let i = 0; i < vertices.length; i++){
            let l = Vector.dist(vertices[i], this.position);
            if(l < dist){
                dist = l;
                index = i;
            }
        }
        return vertices[index];
    }

    contains(p) {
        return Vector.dist(p, this.position) <= this.radius;
    }
}

export class Ray extends Body {

    _range;

    constructor(params) {
        super(params);
        this._range = params.range;
    }

    get range() {
        return this._range;
    }

    set range(num) {
        this._range = num;
        this._resized = true;
    }

    get point() {
        return this.position.clone().add(new Vector(this.range, 0).rot(this.angle));
    }

    getBoundingRect() {
        return { width : 2 * this.range, height : 2 * this.range };
    }
}

export const detectCollision = (b1, b2) => {
    if(b1 instanceof Ball && b2 instanceof Ball) {
        return detectCollisionBallVsBall(b1, b2);
    } else if(b1 instanceof Polygon && b2 instanceof Polygon) {
        return detectCollisionPolyVsPoly(b1, b2);
    } else if(b1 instanceof Ball && b2 instanceof Polygon) {
        return detectCollisionBallVsPoly(b1, b2);
    } else if(b1 instanceof Polygon && b2 instanceof Ball) {
        return detectCollisionBallVsPoly(b2, b1);
    } else if(b1 instanceof Ray && b2 instanceof Polygon) {
        return detectCollisionRayVsPoly(b1, b2);
    } else if(b1 instanceof Polygon && b2 instanceof Ray) {
        return detectCollisionRayVsPoly(b2, b1);
    } else if(b1 instanceof Ray && b2 instanceof Ball) {
        return detectCollisionRayVsBall(b1, b2);
    } else if(b1 instanceof Ball && b2 instanceof Ray) {
        return detectCollisionRayVsBall(b2, b1);
    } else if(b1 instanceof Ray && b2 instanceof Ray) {
        return detectCollisionRayVsRay(b2, b1);
    } else {
        return {
            collide: false
        }
    }
}

const detectCollisionLineVsLine = (a, b, c, d) => {
    const r = b.clone().sub(a);
    const s = d.clone().sub(c);
    
    const den = r.x * s.y - r.y * s.x; 
	const u = ((c.x - a.x) * r.y - (c.y - a.y) * r.x) / den;
	const t = ((c.x - a.x) * s.y - (c.y - a.y) * s.x) / den;



    if((0 <= u && u <= 1 && 0 <= t && t <= 1)) {
        return {
            collide: true,
            point: a.clone().add(r.clone().mult(t))
        }
    }
    return {
        collide: false
    }
}

const detectCollisionRayVsRay = (ray1, ray2) => {
    const info =  detectCollisionLineVsLine(ray1.position, ray1.point, ray2.position, ray2.point);
    if(info.collide) {
        ray1._collisions.all.add(ray2);
        ray2._collisions.all.add(ray1);
    }
    return info;
}

const detectCollisionRayVsPoly = (ray, b) => {
    const rayPoint = ray.point;
    let minDist = Infinity;
    let point = null;
    const vertices = b.getComputedVertices();
    for(let i = 0; i < vertices.length; ++i) {
        const v1 = vertices[i];
        const v2 = vertices[(i + 1) % vertices.length];
        const info = detectCollisionLineVsLine(ray.position, rayPoint, v1, v2);
        if(info.collide) {
            const dist = Vector.dist(ray.position, info.point);
            
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

const detectCollisionRayVsBall = (ray, b) => {
    
    const rayPoint = ray.point;
    const rayVec = rayPoint.clone().sub(ray.position).unit();
    const originToBall = b.position.clone().sub(ray.position);
    const r2 = b.radius ** 2;
    const originToBallLength2 = originToBall.mag() ** 2;

    const a = Vector.dot(originToBall, rayVec);
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

    const point = ray.position.clone().add(rayVec.clone().mult(t));

    if(Vector.dot(point.clone().sub(ray.position), rayPoint.clone().sub(ray.position)) < 0 || Vector.dist(point, ray.position) > ray.range) {
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

const detectCollisionBallVsBall = (b1, b2) => {
    let v = b1.position.clone().sub(b2.position);
    let info = {};
    if(v.mag() < b1.radius + b2.radius) {
        info.normal = v.clone().unit();
        info.depth = b1.radius + b2.radius - v.mag();
        info.point = b1.position.clone().add(info.normal.clone().mult(b1.radius));
        info.collide = true;
        b1._collisions.all.add(b2);
        b2._collisions.all.add(b1);
        return info;
    }
    return {
        collide: false,
    };
}

const detectCollisionPolyVsPoly = (b1, b2) => {
    const verts1 = b1.getComputedVertices();
    const verts2 = b2.getComputedVertices();
    const normals1 = Polygon.getFaceNormals(verts1);
    const normals2 = Polygon.getFaceNormals(verts2);
    let e1SupportPoints = [];
    for(let i = 0; i < normals1.length; i++){
        let spInfo = Polygon.findSupportPoint(verts2, normals1[i].clone().mult(-1), verts1[i]);
        spInfo.n = normals1[i].clone();
        e1SupportPoints[i] = spInfo;
        if(spInfo.sp == undefined) return { collide : false };
    }
    let e2SupportPoints = [];
    for(let i = 0; i < normals2.length; i++){
        let spInfo = Polygon.findSupportPoint(verts1, normals2[i].clone().mult(-1), verts2[i]);
        spInfo.n = normals2[i].clone();
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
    let v = b2.position.clone().sub(b1.position);
    if(Vector.dot(v, e1SupportPoints[index].n) > 0){
        e1SupportPoints[index].n.mult(-1);
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

const detectCollisionBallVsPoly = (b1, b2) => {
    const verts = b2.getComputedVertices();
    const normals = Polygon.getFaceNormals(verts);
    let e1SupportPoints = [];
    for(let i = 0; i < normals.length; i++){
        let info = b1.findSupportPoint(normals[i].clone().mult(-1), verts[i].clone());
        if(info.sp == undefined) return { collide : false };
        e1SupportPoints[i] = info;
    }
    // let nearestVertex = b1.findNearestVertex(verts);
    let normal = b2.position.clone().sub(b1.position).unit().mult(-1);
    let info = Polygon.findSupportPoint(verts, normal.clone(), b1.position.clone().add(normal.clone().mult(-b1.radius)));
    if(info.sp == undefined) return { collide : false };
    info.n = normal.clone();
    e1SupportPoints.push(info);
    let max = Infinity;
    let index = 0;
    for(let i = 0; i < e1SupportPoints.length; i++){
        if(e1SupportPoints[i].depth < max){
            max = e1SupportPoints[i].depth;
            index = i;
        }
    }
    let v = b2.position.clone().sub(b1.position);
    if(Vector.dot(v, e1SupportPoints[index].n) < 0){
        e1SupportPoints[index].n.mult(-1);
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

export const resolveCollision = (b1, b2, options) => {

    if(b1 instanceof Ball && b2 instanceof Polygon) {
        [b1, b2] = [b2, b1];
    }
    const detect = detectCollision(b1, b2);
    
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

        const bounce = options.bounce;
        const friction = options.friction;

        const directions = {
            left: new Vector(-1, 0),
            right: new Vector(1, 0),
            top: new Vector(0, -1),
            bottom: new Vector(0, 1),
        };
        
        let direction;
        if (Vector.dot(detect.normal, directions.left) >= Math.SQRT2 / 2) {
            direction = "left";
            
        } else if (Vector.dot(detect.normal, directions.right) >= Math.SQRT2 / 2) {
            direction = "right";
            
        } else if (Vector.dot(detect.normal, directions.top) >= Math.SQRT2 / 2) {
            direction = "top";
            
        } else if (Vector.dot(detect.normal, directions.bottom) >= Math.SQRT2 / 2) {
            direction = "bottom";
            
        }

        const r1 = detect.point.clone().sub(b1.position);
        const r2 = detect.point.clone().sub(b2.position);
        const w1 = b1.angularVelocity;
        const w2 = b2.angularVelocity;
        const v1 = b1._vel;
        const v2 = b2._vel;
        const vp1 = v1.clone().add(new Vector(-w1 * r1.y, w1 * r1.x));
        const vp2 = v2.clone().add(new Vector(-w2 * r2.y, w2 * r2.x));
        const relVel = vp1.clone().sub(vp2);
        const j = (-(1 + bounce) * Vector.dot(relVel, detect.normal)) / (b1.inverseMass + b2.inverseMass + Math.pow(Vector.cross(r1, detect.normal), 2) / b1.inertia + Math.pow(Vector.cross(r2, detect.normal), 2) / b2.inertia);
        const jn = detect.normal.clone().mult(j);
        const vel1 = jn.clone().mult(b1.inverseMass);
        const vel2 = jn.clone().mult(b2.inverseMass);


        const left = Vector.dot(jn, directions.left),
        right = Vector.dot(jn, directions.right),
        top = Vector.dot(jn, directions.top),
        bottom = Vector.dot(jn, directions.bottom);
        if((left >= Math.SQRT2 / 2 || (left < Math.SQRT2 / 2 && direction == "left")) && (!b1.options.sides.right || !b2.options.sides.left)) {
            return res;
        } else if((right >= Math.SQRT2 / 2 || (right < Math.SQRT2 / 2 && direction == "right")) && (!b1.options.sides.left || !b2.options.sides.right)) {
            return res;
        } else if((top >= Math.SQRT2 / 2 || (top < Math.SQRT2 / 2 && direction == "top")) && (!b1.options.sides.bottom || !b2.options.sides.top)) {
            return res;
        } else if((bottom >= Math.SQRT2 / 2 || (bottom < Math.SQRT2 / 2 && direction == "bottom")) && (!b1.options.sides.top || !b2.options.sides.bottom)) {
            return res;
        }


        
        const diff = detect.normal.clone().mult((detect.depth) / (b1.inverseMass + b2.inverseMass));
        b1.position.add(diff.clone().mult(b1.inverseMass));
        b2.position.sub(diff.clone().mult(b2.inverseMass)); 

        const relVelDotN = Vector.dot(relVel, detect.normal);
        if (relVelDotN <= 0) {

            b1._vel.add(vel1);
            b2._vel.sub(vel2);
            b1.angularVelocity += Vector.cross(r1, vel1.clone().mult(1 / b1.inertia));
            b2.angularVelocity -= Vector.cross(r2, vel2.clone().mult(1 / b1.inertia));

            const tangent = detect.normal.clone().norm();

            const j2 = (-(1 + bounce) * Vector.dot(relVel, tangent) * friction) / (b1.inverseMass + b2.inverseMass + Math.pow(Vector.cross(r1, tangent), 2) / b1.inertia + Math.pow(Vector.cross(r2, tangent), 2) / b2.inertia);
            const jt = tangent.clone().mult(j2);
            const vel1a = jt.clone().mult(b1.inverseMass);
            const vel2a = jt.clone().mult(b2.inverseMass);
            b1._vel.add(vel1a.clone());
            b2._vel.sub(vel2a.clone());
            b1.angularVelocity += Vector.cross(r1, vel1a.clone().mult(1 / b1.inertia));
            b2.angularVelocity -= Vector.cross(r2, vel2a.clone().mult(1 / b2.inertia));

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
            if(b2.followBottomObject) b2.passiveVelocity = b1.velocity;
        } else if(direction == "top") {
            if(b1.followBottomObject) b1.passiveVelocity = b2.velocity;
        }
        

        return res;
    }
    return {
        collide: false
    };
}