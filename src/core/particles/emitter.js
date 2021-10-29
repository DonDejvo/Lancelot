import { Component } from "../component.js"
import { math } from "../utils/math.js";
import { ParamParser } from "../utils/param-parser.js";
import { Vector } from "../utils/vector.js";

export class Emitter extends Component {
    constructor(params) {
        super();
        this._particles = [];
        this._width = ParamParser.ParseValue(params.width, 0);
        this._angle = ParamParser.ParseValue(params.angle, 0);
        this._options = ParamParser.ParseObject(params.options, {
            lifetime: { min: 1000, max: 1000 },
            friction: { min: 0, max: 0 },
            variance: { min: 0, max: 0 },
            angle: { min: 0, max: Math.PI * 2 },
            speed: { min: 300, max: 300 },
            force: { x: 0, y: 0 },
            scale: { from: 1, to: 1 },
            opacity: { from: 1, to: 1 },
            rotationSpeed: { min: 0, max: 0 }
        });
        this._emitting = null;
    }
    _CreateParticle() {
        
        const particle = this.scene.CreateEntity();
        
        const n = Vector.FromAngle(this._angle);
        const pos = this.position.Clone().Add(n.Clone().Mult(math.rand(-this._width / 2, this._width / 2)));
        particle.position.Copy(pos);
        
        particle.groupList.add("particle");

        const particleType = math.choice(this._particles);
        particle.AddComponent(new particleType[0](particleType[1]), "Sprite");

        particle.AddComponent(new ParticleController(this._options, this._angle));
    }
    Add(type, params) {
        this._particles.push([type, params]);
    }
    Emit(count, repeat = false, delay = 0) {
        if(repeat) {
            this._emitting = {
                count: count,
                counter: delay,
                delay: delay
            };
        } else {
            for(let i = 0; i < count; ++i) {
                this._CreateParticle();
            }
        }
    }
    Update(elapsedTimeS) {
        if(this._emitting) {
            const emitting = this._emitting;
            emitting.counter += elapsedTimeS * 1000;
            if(emitting.counter >= emitting.delay) {
                emitting.counter = 0;
                this.Emit(emitting.count);
            }
        }
    }
}

class ParticleController extends Component {
    constructor(params, angle) {
        super();
        this._friction = this._InitMinMax(params.friction);
        this._lifetime = this._InitMinMax(params.lifetime);
        this._angleVariance = this._InitMinMax(params.variance);
        this._acc = new Vector(params.force.x, params.force.y);
        this._counter = 0;
        this._scale = this._InitRange(params.scale);
        this._opacity = this._InitRange(params.opacity);
        this._vel = new Vector(this._InitMinMax(params.speed), 0).Rotate(angle - Math.PI / 2 + this._InitMinMax(params.angle));
        this._rotationSpeed = this._InitMinMax(params.rotationSpeed);
    }
    _InitMinMax(param) {
        return math.rand(param.min, param.max);
    }
    _InitRange(param) {
        if(!param) {
            return null;
        } else {
            return { from: param.from == undefined ? 1 : param.from, to: param.to };
        }
    }
    Update(elapsedTimeS) {

        this._counter += elapsedTimeS * 1000;
        if(this._counter >= this._lifetime) {
            this.scene.RemoveEntity(this.parent);
            return;
        }

        this._vel.Add(this._acc.Clone().Mult(elapsedTimeS));
        const decceleration = 60;
        const frameDecceleration = new Vector(this._vel.x * decceleration * this._friction, this._vel.y * decceleration * this._friction);
        this._vel.Sub(frameDecceleration.Mult(elapsedTimeS));
        this._vel.Rotate(math.rand(-this._angleVariance, this._angleVariance)  * elapsedTimeS);
        this.position.Add(this._vel.Clone().Mult(elapsedTimeS));

        const sprite = this.GetComponent("Sprite");
        const progress = Math.min(this._counter / this._lifetime, 1);
        if(this._scale) {
            sprite.scale = math.lerp(progress, this._scale.from, this._scale.to);
        }
        if(this._opacity) {
            sprite.opacity = math.lerp(progress, this._opacity.from, this._opacity.to);
        }
        sprite.angle += this._rotationSpeed * elapsedTimeS;
    }
}