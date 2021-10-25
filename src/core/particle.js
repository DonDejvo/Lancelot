import { Component } from "./component.js";
import { math } from "./utils/math.js";
import { ParamParser } from "./utils/param-parser.js";
import { Vector } from "./utils/vector.js";

class Emitter extends Component {
    constructor(params) {
        super();
        this._particles = [];
        const temp = ParamParser.ParseObject(params.acceleration, { x: 0, y: 0 });
        this._options = {
            lifetime: ParamParser.ParseObject(params.lifetime, { min: 1000, max: 1000 }),
            friction: ParamParser.ParseValue(params.friction, 0),
            angleVariance: ParamParser.ParseValue(params.variance, 0),
            angle: ParamParser.ParseObject(params.angle, { min: 0, max: 0 }),
            speed: ParamParser.ParseObject(params.speed, { min: 0, max: 0 }),
            acceleration: new Vector(temp.x, temp.y),
            scale: ParamParser.ParseObject(params.scale, { from: 1, to: 1 }),
            opacity: ParamParser.ParseObject(params.opacity, { from: 1, to: 1 }),
            rotationSpeed: ParamParser.ParseValue(params.rotationalSpeed, 0)
        };
        this._emitting = null;
    }
    _CreateParticle() {
        
        const particle = this.scene.CreateEntity();
        particle.groupList.add("particle");
        particle.position.Copy(this.position);

        const particleType = math.choice(this._particles);
        particle.AddComponent(new particleType[0](particleType[1]), "Sprite");

        particle.AddComponent(new ParticleController(this._options));
    }
    AddParticle(type, params) {
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
    constructor(params) {
        super();
        this._friction = (params.friction || 0);
        this._lifetime = this._InitMinMax(params.lifetime);
        this._angleVariance = (params.angleVariance || 0);
        this._acc = (params.acceleration || new Vector());
        this._counter = 0;
        this._scale = this._InitRange(params.scale);
        this._opacity = this._InitRange(params.opacity);
        this._vel = new Vector(this._InitMinMax(params.speed), 0).Rotate(this._InitMinMax(params.angle));
        this._rotationSpeed = (params.rotationSpeed || 0);
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

        this._vel.Add(this._acc.Mult(elapsedTimeS));
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
        this._rotationSpeed -= this._rotationSpeed * decceleration * this._friction;
        sprite.angle += this._rotationSpeed * elapsedTimeS;
    }
}

export const particle = {
    Emitter
};