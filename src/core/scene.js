import { TimeoutHandler } from "./utils/timeout-handler.js";
import { EntityManager } from "./entity-manager.js";
import { Camera } from "./camera.js";
import { Interactive } from "./interactive.js";
import { Entity } from "./entity.js";
import { World } from "./physics/physics.js";
import { AmbientLight } from "./light/light.js";
import { Vector } from "./utils/vector.js";

export class Scene {
    constructor(params) {

        // this._bounds = (params.bounds || [[-1000, -1000], [1000, 1000]]);
        // this._cellDimensions = (params.cellDimensions || [100, 100]);
        // this._relaxationCount = (params.relaxationCount || 5);

        this.background = params.background;

        this._world = new World(params.physics);

        this.paused = true;
        this.speed = 1.0;
        this.timeout = new TimeoutHandler();

        this._lights = [];
        this._ambientLight = new AmbientLight({
            color: (params.light || "white")
        });

        // this._bodies = [];
        this._drawable = [];
        this._interactiveEntities = [];

        this._eventHandlers = new Map();

        this._entityManager = new EntityManager();
        // this._spatialGrid = new SpatialHashGrid(this._bounds, [Math.floor((this._bounds[1][0] - this._bounds[0][0]) / this._cellDimensions[0]), Math.floor((this._bounds[1][1] - this._bounds[0][1]) / this._cellDimensions[1])]);
        this._camera = new Camera();
        
    }
    get camera() {
        return this._camera;
    }
    set light(color) {
        this._ambientLight.color = color;
    }
    CreateEntity(n) {
        const e = new Entity();
        this.AddEntity(e, n);
        return e;
    }
    AddEventHandler(type, handler) {
        if(!this._eventHandlers.has(type)) {
            this._eventHandlers.set(type, []);
        }
        const handlers = this._eventHandlers.get(type);
        handlers.push(handler);
    }
    RemoveEventHandler(type, handler) {
        if(!this._eventHandlers.has(type)) { return; }
        const handlers = this._eventHandlers.get(type);
        const idx = handlers.indexOf(handler);
        if(idx > -1) {
            handlers.splice(idx, 1);
        }

    }
    SetInteractive(entity, params = {}) {
        this._interactiveEntities.push(entity);
        const interactive = new Interactive(params);
        entity.AddComponent(interactive);
        entity.interactive = interactive;
    }
    _On(type, event) {
        if(this._eventHandlers.has(type)) {
            const handlers = this._eventHandlers.get(type);
            for(let handler of handlers) {
                handler(event);
            }
        }
        if(type == "mousedown") {
            // const entities = this._world._spatialGrid.FindNear([event.x, event.y], [0, 0]).map(c => c.entity);
            const entities = this._world._quadtree.FindNear([event.x, event.y], [0, 0]).map(c => c.entity);
            for(let e of entities) {
                if(!e.interactive) { continue; }
                
                if(e.body.Contains(new Vector(event.x, event.y))) {
                    e.interactive._On(type, event);
                    e.interactive._id = event.id;
                    if(e.interactive._capture) { break; }
                }
            }
        } else if(type == "mousemove" || type == "mouseup") {
            for(let e of this._interactiveEntities) {
                if(e.interactive._id == event.id) {
                    e.interactive._On(type, event);
                    if(type == "mouseup") {
                        e.interactive._id = -1;
                    }
                }
            }
        }
    }
    GetEntityByName(n) {
        return this._entityManager.Get(n);
    }
    GetEntitiesByGroup(g) {
        return this._entityManager.Filter((e) => e.groupList.has(g));
    }
    AddEntity(e, n) {
        e._scene = this;
        this._entityManager.Add(e, n);
    }
    RemoveEntity(e) {
        this._entityManager.Remove(e);
        e._components.forEach((c) => {
            if (c._type == "drawable") {
                this._RemoveDrawable(c);
            } else if(c._type == "body") {
                this._RemoveBody(e, c);
            } else if(c._type == "light") {
                const idx = this._lights.indexOf(c);
                this._lights.splice(idx, 1);
            }
        });
    }
    _AddDrawable(c) {
        this._drawable.push(c);
        for (let i = this._drawable.length - 1; i > 0; --i) {
            if (c._zIndex >= this._drawable[i - 1]._zIndex) {
                break;
            }
            [this._drawable[i], this._drawable[i - 1]] = [this._drawable[i - 1], this._drawable[i]];
        }
    }
    _RemoveDrawable(c) {
        const i = this._drawable.indexOf(c);
        if (i != -1) {
            this._drawable.splice(i, 1);
        }
    }
    _AddBody(e, b) {
        this._world._AddBody(e, b);
        /*
        e.body = b;
        const boundingRect = b.boundingRect;
        const gridController = new SpatialGridController({
            grid: this._spatialGrid,
            width: boundingRect.width,
            height: boundingRect.height
        });
        e.AddComponent(gridController);
        
        this._bodies.push(b);
        */
    }
    _RemoveBody(e, b) {
        this._world._RemoveBody(e, b);
        /*
        const gridController = e.GetComponent("SpatialGridController");
        if(gridController) {
            this._spatialGrid.RemoveClient(gridController._client);
        }

        const i = this._bodies.indexOf(b);
        if (i != -1) {
            this._bodies.splice(i, 1);
        }
        */
    }
    _PhysicsUpdate(elapsedTimeS) {
        for(let body of this._bodies) {
            body._collisions.left.clear();
            body._collisions.right.clear();
            body._collisions.top.clear();
            body._collisions.bottom.clear();
        }
        for(let body of this._bodies) {
            body.UpdatePosition(elapsedTimeS);
        }
        for(let i = 0; i < this._relaxationCount; ++i) {
            for(let body of this._bodies) {
                body.HandleBehavior();
            }
        }
    }
    Update(elapsedTimeS) {
        if (this.paused) { return; }
        this.timeout.Update(elapsedTimeS * 1000);
        elapsedTimeS *= this.speed;
        this._entityManager.Update(elapsedTimeS);
        this._world.Update(elapsedTimeS);
        // this._PhysicsUpdate(elapsedTimeS);
        this._camera.Update(elapsedTimeS);
    }
    Play() {
        this.paused = false;
    }
    Pause() {
        this.paused = true;
    }
}