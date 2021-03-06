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
    //_lights = [];
    _drawable = [];
    _interactiveEntities = [];
    _keys = new Set();
    _entityManager = new EntityManager();
    _buffer = null;
    //_light;
    _background;
    _timeout = new TimeoutHandler();
    _camera;
    _interactive = new Interactive();
    _game = null;
    debug = false;
    _drawCounter = 0;
    
    /**
     * 
     * @param {Object} options
     * @param {string} options.light
     * @param {string} options.background
     * @param {import("../physics/World.js").WorldParams} options.world
     */

    constructor(game, name, zIndex, options = {}) {
        this._game = game;
        this._game._sceneManager.add(this, name, zIndex);
        this._world = new World(options.world);
        //this._light = new Color(paramParser.parseValue(options.light, "white"));
        this._background = new Color(paramParser.parseValue(options.background, options.background));
        this._camera = new Camera(this, "Camera");
        //this.addEntity(this._camera, "Camera");
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
        return this._game.resources;
    }

    get audio() {
        return this._game.audio;
    }

    get background() {
        return this._background;
    }

    set background(col) {
        this._background.copy(col);
    }

    get game() {
        return this._game;
    }
    /*
    get light() {
        return this._light._color;
    }

    set light(col) {
        this._light.set(col);
    }
    */
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
        if(this.paused) {
            return false;
        }
        let captured = false;
        if(type.startsWith("mouse")) {
            
            if(type == "mousedown") {
                const entities = this.world.findNear([event.x, event.y], [0, 0]);
                for(let e of entities) {
                    if(!e.interactive) {
                        continue;
                    }
                    if(e.body.contains(new Vector(event.x, event.y))) {
                        e.interactive._id = event.id;
                        if(e.interactive.handleEvent(type, event)) {
                            captured = true;
                        }
                    }
                }
            } else {
                for(let e of this._interactiveEntities) {
                    if(event.id != -1 && e.interactive._id == event.id) {
                        if(e.interactive.handleEvent(type, event)) {
                            captured = true;
                        }
                        if(type == "mouseup") {
                            e.interactive._id = -1;
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

    
    create(n) {
        const e = new Entity(this, n);
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
    /*
    addLight(c) {
        this._lights.push(c);
    }

    removeLight(c) {
        this._lights.splice(this._lights.indexOf(c), 1);
    }
    */
    hide() {
        this._paused = true;
        this._hidden = true;
    }

    show() {
        this._hidden = false;
    }

    pause() {
        this._paused = true;
    }

    play() {
        this._paused = false;
        this._hidden = false;
    }

    /*
    drawLights(ctx, w, h, q) {

        ctx.globalCompositeOperation = "source-over";
        ctx.beginPath();
        this._light.fill(ctx);
        ctx.fillRect(0, 0, w, h);

        const cam = this._camera;
        const camPos = cam.position.clone().add(cam.shaker.offset);
        const camScale = cam.scale * q / 1;

        ctx.globalCompositeOperation = "lighter";
        ctx.save();
        ctx.translate(-camPos.x * camScale + w / 2, -camPos.y * camScale + h / 2);
        ctx.scale(camScale, camScale);

        for(let light of this._lights) {
            light.drawInternal(ctx);
        }

        ctx.restore();
        ctx.globalCompositeOperation = "multiply";
    }

    drawObjects(ctx, w, h, q) {

        const cam = this._camera;
        const camPos = cam.position.clone().add(cam.shaker.offset);
        const camScale = cam.scale * q / 1;

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
        buffer.translate(-camPos.x * camScale + w / 2, -camPos.y * camScale + h / 2);
        buffer.scale(camScale, camScale);

        if(this.debug) {
            this.world.quadtree.draw(buffer);

            for(let body of this.world._bodies) {
                body.draw(buffer);
            }
        }

        this._drawCounter = 0;

        for(let elem of this._drawable) {
            const boundingBox = elem.getBoundingBox();
            const pos = new Vector(boundingBox.x, boundingBox.y);
            pos.sub(camPos);
            pos.mult(cam.scale);
            const [width, height] = [boundingBox.width, boundingBox.height].map((_) => _ * cam.scale);
            if(
                pos.x + width / 2 < -w / 2 / q ||
                pos.x - width / 2 > w / 2 / q ||
                pos.y + height / 2 < -h / 2 / q ||
                pos.y - height / 2 > h / 2 / q
            ) {
                continue;
            }
            ++this._drawCounter;
            elem.drawInternal(buffer);
        }

        buffer.restore();

        this._drawDebugInfo(buffer, w * q, h * q);

        ctx.drawImage(buffer.canvas, 0, 0);
    }
    */

    /*
    onUpdate(cb) {
        this._onUpdate = cb;
    }
    */

    update(_) {}

    _update(elapsedTimeS) {
        if (this._paused) {
            return;
        }
        this.timeout.update(elapsedTimeS * 1000);
        this._entityManager.update(elapsedTimeS);
        this.update(elapsedTimeS);
        this._world.update(elapsedTimeS);
    }

    render(w, h, q) {
        const cam = this._camera;
        const camPos = cam.position.clone().add(cam.shaker.offset);
        const camScale = cam.scale * q / 1;

        if(!this._buffer) {
            this._buffer = document.createElement("canvas").getContext("2d");
            this._buffer.canvas.width = w;
            this._buffer.canvas.height = h;
            this._buffer.imageSmoothingEnabled = false;
        }
        const buffer = this._buffer;

        buffer.beginPath();
        buffer.clearRect(0, 0, w, h);
        buffer.fillStyle = this.background.value;
        buffer.fillRect(0, 0, w, h);

        buffer.save();
        buffer.translate(Math.floor(-camPos.x * camScale + w / 2 + 0.5), Math.floor(-camPos.y * camScale + h / 2 + 0.5));
        buffer.scale(camScale, camScale);

        this._drawCounter = 0;

        for(let elem of this._drawable) {
            const boundingBox = elem.getBoundingBox();
            const pos = new Vector(boundingBox.x, boundingBox.y);
            pos.sub(camPos);
            pos.mult(cam.scale);
            const [width, height] = [boundingBox.width, boundingBox.height].map((_) => _ * cam.scale);
            if(
                pos.x + width / 2 < -w / 2 / q ||
                pos.x - width / 2 > w / 2 / q ||
                pos.y + height / 2 < -h / 2 / q ||
                pos.y - height / 2 > h / 2 / q
            ) {
                continue;
            }
            ++this._drawCounter;
            elem.drawInternal(buffer);
        }

        if(this.debug) {
            if(this.world.quadtree) {
                this.world.quadtree.draw(buffer);
            }

            for(let body of this.world._bodies) {
                body.draw(buffer);
            }
        }

        buffer.restore();
        this._drawDebugInfo(buffer, w, h);
    }

    draw(ctx, w, h, q) {
        if(!this._buffer) {
            this.render(w, h, q);
        }
        ctx.drawImage(this._buffer.canvas, 0, 0, w, h);
    }

    _drawDebugInfo(ctx, w, h) {
        if(!this.debug) {
            return;
        }
        const left = 0,
        top = 0,
        minWidth = Math.max(w * 0.4, 200),
        minHeight = Math.max(w * 0.2, 100),
        margin = Math.max(w * 0.01, 4),
        fontSize = Math.max(w * 0.025, 12),
        padding = Math.max(w * 0.005, 2),
        color = "white",
        background = "rgba(128,128,128,0.5)";
        let info = [
            `Paused: ${this._paused}`,
            `FPS: ${this._game._engine._fpsMeter.fps}`,
            `Keys pressed: ${Array.from(this._keys).join(",")}`,
            `Entities: ${this._entityManager._entities.length}`,
            `Bodies: ${this._world._bodies.length}`,
            `${this._drawCounter} objects drawn of total ${this._drawable.length}`,
            `Camera: x = ${this.camera.position.x.toFixed(2)}, y = ${this.camera.position.y.toFixed(2)}, z = ${this.camera.scale.toFixed(2)}`
        ];

        ctx.beginPath();
        ctx.font = fontSize + "px Arial";
        ctx.fillStyle = background;
        ctx.fillRect(left, top, Math.max(Math.max(...info.map((e) => ctx.measureText(e).width)) + margin * 2, minWidth), Math.max(info.length * (fontSize + padding) + margin * 2, minHeight));
        ctx.textBaseline = "top";
        ctx.fillStyle = color;
        for(let i = 0; i < info.length; ++i) {
            ctx.fillText(info[i], left + margin, top + margin + i * (fontSize + padding));
        }
        
    }
}