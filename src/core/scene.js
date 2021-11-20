import { Interactive } from "../interactive/Interactive.js";
import { World } from "../physics/World.js";
import { Color } from "../utils/Color.js";
import { paramParser } from "../utils/ParamParser.js";
import { TimeoutHandler } from "../utils/TimeoutHandler.js";
import { Camera } from "./Camera.js";
import { Entity } from "./Entity.js";
import { EntityManager } from "./EntityManager.js";
import { Vector } from "../utils/Vector.js";

export class Scene {

    _paused = true;
    _hidden = true;
    _world;
    _lights = [];
    _drawable = [];
    _interactiveEntities = [];
    _keys = new Set();
    _entityManager = new EntityManager();
    _buffer = null;
    _light;
    _background;
    _timeout = new TimeoutHandler();
    _camera;
    _interactive = new Interactive();
    _resources = null;

    /**
     * 
     * @param {Object} options
     * @param {string} options.light
     * @param {string} options.background
     * @param {import("../physics/World.js").WorldParams} options.physics
     */

    constructor(options = {}) {
        this._world = new World(options.physics);
        this._light = new Color(paramParser.parseValue(options.light, "white"));
        this._background = new Color(paramParser.parseValue(options.background, options.background));
        this._camera = new Camera();
        this.addEntity(this._camera, "Camera");
    }

    get paused() {
        return this._paused;
    }

    get hidden() {
        return this._hidden;
    }

    get timeout() {
        return this._timeout;
    }

    get camera() {
        return this._camera;
    }

    get world() {
        return this._world;
    }
    
    get resources() {
        return this._resources;
    }

    get background() {
        return this._background._color;
    }

    set background(col) {
        this._background.set(col);
    }

    get light() {
        return this._light._color;
    }

    set light(col) {
        this._light.set(col);
    }

    get interactive() {
        return this._interactive;
    }

    isKeyPressed(key) {
        return this._keys.has(key);
    }

    setInteractive(entity) {
        this._interactiveEntities.push(entity);
        const interactive = new Interactive();
        entity.addComponent(interactive);
        entity._interactive = interactive;
    }

    getEntityByName(n) {
        return this._entityManager.get(n);
    }

    getEntitiesByGroup(g) {
        return this._entityManager.filter((e) => e.groupList.has(g));
    }

    handleEvent(type, event) {
        let captured = false;
        if(type.startsWith("mouse")) {
            
            if(type == "mousedown") {
                const entities = this._world.quadtree.findNear([event.x, event.y], [0, 0]).map(c => c.entity);
                for(let e of entities) {
                    if(!e.interactive) {
                        continue;
                    }
                    if(e.body.contains(new Vector(event.x, event.y))) {
                        e.interactive.id = event.id;
                        if(e.interactive.handleEvent(type, event)) {
                            captured = true;
                        }
                    }
                }
            }
        } else if(type.startsWith("key")) {
            switch(type) {
                case "keydown":
                    this._keys.add(event.key);
                    break;
                case "keyup":
                    this._keys.delete(event.key);
                    break;
            }
        }
        if(!captured) {
            if(this._interactive.handleEvent(type, event)) {
                captured = true;
            }
        }
        return captured;
    }

    createEntity(n) {
        const e = new Entity();
        this.addEntity(e, n);
        return e;
    }

    addEntity(e, n) {
        e._scene = this;
        this._entityManager.add(e, n);
    }

    removeEntity(e) {
        this._entityManager.remove(e);
        e._components.forEach((c) => {
            switch(c._type) {
                case "drawable":
                    this.removeDrawable(c);
                    break;
                case "body":
                    this.removeBody(e, c);
                    break;
                case "light":
                    this.removeLight(c);
                    break;
                case "interactive":
                    this._interactiveEntities.splice(this._interactiveEntities.indexOf(e), 1);
                    break;
            }
        });
    }

    addDrawable(c) {
        this._drawable.push(c);
        for (let i = this._drawable.length - 1; i > 0; --i) {
            if (c._zIndex >= this._drawable[i - 1]._zIndex) {
                break;
            }
            [this._drawable[i], this._drawable[i - 1]] = [this._drawable[i - 1], this._drawable[i]];
        }
    }

    removeDrawable(c) {
        const i = this._drawable.indexOf(c);
        if (i != -1) {
            this._drawable.splice(i, 1);
        }
    }

    addBody(e, b) {
        this._world.addBody(e, b);
    }

    removeBody(e, b) {
        this._world.removeBody(e, b);
    }

    addLight(c) {
        this._lights.push(c);
    }

    removeLight(c) {
        this._lights.splice(this._lights.indexOf(c), 1);
    }

    hide() {
        this._paused = true;
        this._hidden = true;
    }

    pause() {
        this._paused = true;
    }

    play() {
        this._paused = false;
        this._hidden = false;
    }

    drawLights(ctx, w, h) {

        ctx.globalCompositeOperation = "source-over";
        ctx.beginPath();
        this._light.fill(ctx);
        ctx.fillRect(0, 0, w, h);

        const cam = this._camera;

        ctx.globalCompositeOperation = "lighter";
        ctx.save();
        ctx.translate(-cam.position.x * cam.scale + w / 2, -cam.position.y * cam.scale + h / 2);
        ctx.scale(cam.scale, cam.scale);

        for(let light of this._lights) {
            light.drawInternal(ctx);
        }

        ctx.restore();
        ctx.globalCompositeOperation = "multiply";
    }

    drawObjects(ctx, w, h) {
        const cam = this._camera;

        if(!this._buffer) {
            this._buffer = document.createElement("canvas").getContext("2d");
            this._buffer.canvas.width = w;
            this._buffer.canvas.height = h;
            this._buffer.imageSmoothingEnabled = false;
        }
        const buffer = this._buffer;

        buffer.beginPath();
        this._background.fill(buffer);
        buffer.fillRect(0, 0, w, h);

        buffer.save();
        buffer.translate(-cam.position.x * cam.scale + w / 2, -cam.position.y * cam.scale + h / 2);
        buffer.scale(cam.scale, cam.scale);

        for(let elem of this._drawable) {
            const boundingBox = elem.getBoundingBox();
            const pos = new Vector(boundingBox.x, boundingBox.y);
            pos.sub(cam.position);
            pos.mult(cam.scale);
            const [width, height] = [boundingBox.width, boundingBox.height].map((_) => _ * cam.scale);
            if(
                pos.x + width / 2 < -w / 2 ||
                pos.x - width / 2 > w / 2 ||
                pos.y + height / 2 < -h / 2 ||
                pos.y - height / 2 > h / 2
            ) {
                continue;
            }
            elem.drawInternal(buffer);
        }

        buffer.restore();

        ctx.drawImage(buffer.canvas, 0, 0);
    }

    update(elapsedTimeS) {
        if (this._paused) {
            return;
        }
        this.timeout.update(elapsedTimeS * 1000);
        this._entityManager.update(elapsedTimeS);
        this._world.update(elapsedTimeS);
    }
}