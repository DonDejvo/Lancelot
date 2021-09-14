const css = (elem, style) => {
    for(let attr in style) {
        elem.style[attr] = style[attr];
    }
}

const id = (arg) => document.getElementById(arg);

const show = (elem, val = "block") => {
    elem.style.display = val;
}

const hide = (elem) => {
    elem.style.display = "none";
}

class Vector {
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }
    Copy(v1) {
        this.x = v1.x;
        this.y = v1.y;
    }
    Clone() {
        return new Vector(this.x, this.y);
    }
    Add(v1) {
        this.x += v1.x;
        this.y += v1.y;
        return this;
    }
    Sub(v1) {
        this.x -= v1.x;
        this.y -= v1.y;
        return this;
    }
    Mult(s) {
        this.x *= s;
        this.y *= s;
        return this;
    }
    Norm() {
        [this.x, this.y] = [this.y, -this.x];
        return this;
    }
    Unit() {
        const z = this.Mag();
        if (z === 0) {
            return this;
        }
        this.x /= z;
        this.y /= z;
        return this;
    }
    Mag() {
        return Math.sqrt(Math.pow(this.x, 2) + Math.pow(this.y, 2));
    }
    Lerp(v1, alpha) {
        this.Add(v1.Clone().Sub(this).Mult(alpha));
        return this;
    }
    Angle() {
        return Math.atan2(this.y, this.x);
    }
    static Dot(v1, v2) {
        return v1.x * v2.x + v1.y * v2.y;
    }
    static Dist(v1, v2) {
        return Math.sqrt(Math.pow((v1.x - v2.x), 2) + Math.pow((v1.y - v2.y), 2));
    }
    static AngleBetween(v1, v2) {
        const z1 = v1.Mag();
        const z2 = v2.Mag();
        if (z1 === 0 || z2 === 0) {
            return 0;
        }
        return Math.acos(Vector.Dot(v1, v2) / (z1 * z2));
    }
}

const math = (function () {
    return {
        rand(min, max) {
            return Math.random() * (max - min) + min;
        },
        randint(min, max) {
            return Math.floor(Math.random() * (max - min + 1) + min);
        },
        lerp(x, a, b) {
            return a + (b - a) * x;
        },
        clamp(x, a, b) {
            return Math.min(Math.max(x, a), b);
        },
        in_range(x, a, b) {
            return x >= a && x <= b;
        },
        sat(x) {
            return Math.min(Math.max(x, 0), 1);
        },
        ease_out(x) {
            return Math.min(Math.max(Math.pow(x, 1 / 2), 0), 1);
        },
        ease_in(x) {
            return Math.min(Math.max(Math.pow(x, 3), 0), 1);
        }
    };
})();


class Engine {
    constructor(params) {

        this._params = params;

        this._renderer = params.renderer;
        this._sceneManager = params.scenes;
        this._callback = params.start;

        this._paused = true;
        this._timeouts = [];

        this._Init();
    }
    Timeout(f, dur) {
        this._timeouts.push({ action: f, dur: dur, counter: 0 });
    }
    _Init() {

        this.Start();
        
        const introSectionClick = id("intro-section-click");
        const introSection = id("intro-section");

        const eventByDevice = navigator.userAgent.match(/ipod|ipad|iphone/i) ? "touchstart" : "click";

        introSectionClick.addEventListener(eventByDevice, () => {
            
            hide(introSectionClick);
            show(introSection);
            
            this.Timeout(() => this._callback(), 2000);

        }, { once: true });

    }
    _RAF() {

        if(this._paused) { return; }

        this._frame = window.requestAnimationFrame((timestamp) => {
            if(!this._previousRAF) {
                this._previousRAF = performance.now();
            }

            const elapsedTime = Math.min(timestamp - this._previousRAF, 1000 / 30);

            for(let i = 0; i < this._timeouts.length; ++i) {
                const timeout = this._timeouts[i];
                if((timeout.counter += elapsedTime) >= timeout.dur) {
                    timeout.action();
                    this._timeouts.splice(i--, 1);
                }
            }

            if(this._sceneManager._currentScene) {
                this._renderer.Render();
                const elapsedTimeS = (elapsedTime) * 0.001;
                this._sceneManager._currentScene.Update(elapsedTimeS);
            }

            this._previousRAF = timestamp;
            this._RAF();
        });
    }
    Start() {
        this._paused = false;
        this._RAF();
    }
    Stop() {
        this._paused = true;
        window.cancelAnimationFrame(this._frame);
    }
}

class Renderer {

    constructor(params) {
        
        this._params = params;

        this._container = params.container;
        this._canvas = params.canvas;
        this._width = params.width;
        this._height = params.height;
        this._sceneManager = params.scenes;

        this._bgColor = "black";

        this._Init();
    }

    get dimension() {
        return this._canvas.getBoundingClientRect();
    }

    _Init() {

        css(document.body, {
            "user-select": "none",
            "-webkit-user-select": "none",
            "-ms-touch-action": "none",
            "touch-action": "none",
            "position": "relative",
            "height": "100%",
            "overflow": "hidden",
            "margin": "0",
            "padding": "0"
        });

        this._aspect = this._width / this._height;
        this._scale = 1.0;

        this._container.style.width = this._width + "px";
        this._container.style.height = this._height + "px";

        css(this._container, {
            "position": "absolute",
            "left": "50%",
            "top": "50%",
            "transform-origin": "center"
        });

        this._canvas.width = this._width;
        this._canvas.height = this._height;
        this._context = this._canvas.getContext("2d");

        css(this._canvas, {
            "position": "absolute",
            "left": "0",
            "top": "0",
            "display": "block"
        });

        this._InitSections();
        this._InitEvents();

        this._OnResize();
        window.addEventListener("resize", () => this._OnResize());

    }

    CreateSection(id) {

        const section = document.createElement("div");
        section.id = id;
        section.classList.add("game-section");
        this._container.appendChild(section);

        return section;
    }

    _InitSections() {

        const sections = document.getElementsByClassName("game-section");

        for(let section of sections) {
            
            
            hide(section);
        }

        const introSectionClick = this.CreateSection("intro-section-click");
        introSectionClick.innerHTML = `
            <div class="centered-both">
                <h3>Click to start</h3>
            </div>
        `;

        const introSection = this.CreateSection("intro-section");
        introSection.innerHTML = `
            <div class="centered-both">
                <div class="intro-section_container">
                    <svg class="intro-section_logo" version="1.0" xmlns="http://www.w3.org/2000/svg" width="306.000000pt" height="431.000000pt" viewBox="0 0 306.000000 431.000000" preserveAspectRatio="xMidYMid meet">
                        <g transform="translate(0.000000,431.000000) scale(0.100000,-0.100000)" fill="#FFFFFF" stroke="none">
                        <path d="M1546 3868 c-10 -68 -50 -397 -90 -731 l-72 -608 -50 -29 c-28 -15
                -82 -59 -120 -96 -38 -37 -75 -69 -81 -70 -20 -3 -89 -61 -128 -106 -37 -44
                -71 -121 -81 -188 -4 -26 -19 -53 -41 -77 -54 -57 -109 -133 -138 -190 -17
                -34 -41 -63 -69 -82 -65 -45 -131 -124 -145 -173 -17 -62 -2 -118 69 -254 81
                -155 80 -178 -19 -305 l-20 -26 64 -88 c50 -68 73 -91 100 -101 l36 -12 49 85
                c28 46 66 116 85 154 43 84 92 133 175 176 61 31 63 32 101 16 22 -8 41 -14
                43 -12 2 2 10 17 18 33 l15 29 37 -61 c46 -76 109 -147 179 -201 44 -34 60
                -41 81 -35 34 8 121 105 197 219 33 50 58 79 55 65 -4 -17 1 -34 17 -53 l23
                -28 27 21 27 21 77 -38 c84 -41 109 -68 139 -151 82 -223 96 -249 130 -238 26
                8 164 181 164 204 0 9 -14 44 -30 77 -53 108 -41 159 67 279 67 75 86 118 81
                187 -5 65 -44 138 -116 217 -24 26 -51 60 -59 76 -8 15 -35 56 -60 90 -25 33
                -56 84 -70 111 -14 28 -29 52 -34 55 -4 3 -17 31 -29 62 -26 71 -66 125 -126
                174 -27 22 -84 73 -129 115 -44 41 -99 88 -122 104 -37 24 -43 32 -43 64 -1
                60 -119 1218 -137 1334 -9 59 -19 107 -22 107 -4 0 -15 -55 -25 -122z m64
                -894 c22 -220 40 -406 40 -415 0 -15 -6 -16 -42 -7 -24 5 -65 8 -92 5 l-48 -4
                5 41 c3 22 25 208 49 413 23 204 44 370 46 369 1 -2 21 -183 42 -402z m75
                -534 c33 -16 95 -61 138 -100 l77 -72 0 -141 c0 -232 -11 -272 -122 -448 -29
                -47 -91 -156 -138 -242 -47 -86 -87 -157 -90 -157 -3 0 -34 48 -70 107 -36 60
                -113 183 -172 275 -58 93 -105 168 -103 168 15 0 53 -24 49 -31 -2 -4 8 -15
                23 -23 44 -22 66 -53 127 -171 66 -129 118 -197 137 -178 10 10 16 10 27 1 12
                -10 19 -7 39 17 26 33 75 129 125 250 23 55 41 83 58 92 14 7 24 19 22 27 -1
                8 7 17 18 21 11 3 20 10 20 14 0 18 -124 292 -160 352 -52 87 -90 119 -141
                119 -73 0 -145 -90 -284 -354 l-68 -129 -20 39 c-26 51 -32 143 -17 269 l12
                105 75 72 c131 128 200 161 313 153 45 -3 84 -14 125 -35z m-87 -242 c37 -54
                64 -108 118 -232 38 -90 41 -101 27 -112 -14 -10 -23 -3 -58 45 -109 148 -178
                148 -289 1 -27 -36 -51 -66 -55 -67 -3 -1 -14 4 -25 12 -17 13 -16 18 34 112
                29 54 73 130 97 168 83 130 105 140 151 73z m-522 -150 c-1 -169 -1 -169 124
                -363 45 -70 80 -128 78 -130 -2 -2 -34 7 -73 21 -41 14 -94 24 -127 24 l-57 0
                -10 -37 c-13 -47 -14 -114 -2 -145 10 -25 25 -42 90 -101 22 -21 41 -42 41
                -46 0 -16 -213 67 -239 93 -23 24 -24 28 -12 49 63 100 78 163 92 387 12 196
                29 286 64 346 14 24 27 44 28 44 2 0 3 -64 3 -142z m951 105 c57 -78 58 -83
                63 -323 5 -222 6 -226 33 -278 l28 -53 -25 -44 c-14 -24 -43 -56 -63 -72 -51
                -39 -133 -95 -133 -90 0 2 14 22 31 43 43 53 65 101 74 154 4 25 11 53 16 62
                7 13 1 21 -25 37 -46 29 -110 27 -171 -4 -27 -13 -50 -23 -51 -22 -1 1 29 53
                67 116 38 63 76 137 84 166 12 40 33 233 35 323 0 20 15 14 37 -15z m-427
                -275 c75 -94 76 -100 45 -182 -16 -39 -41 -98 -58 -131 l-29 -59 -20 24 c-11
                14 -45 74 -75 134 -62 124 -63 113 13 209 27 33 53 57 65 57 10 0 36 -22 59
                -52z m655 -115 c40 -59 43 -85 16 -128 -41 -63 -56 -78 -68 -63 -23 30 -33 87
                -33 192 l1 111 25 -30 c13 -16 40 -53 59 -82z m-1364 -97 c-12 -89 -30 -156
                -42 -156 -5 0 -19 19 -31 43 -42 80 -25 167 50 267 l27 35 3 -55 c2 -30 -2
                -90 -7 -134z m1496 -73 c52 -71 66 -130 41 -176 -6 -12 -37 -53 -70 -90 -32
                -38 -67 -86 -78 -107 -26 -51 -26 -125 1 -198 11 -31 23 -64 25 -72 3 -8 -13
                -35 -34 -59 l-38 -44 -28 84 c-55 161 -100 221 -193 263 -24 10 -43 22 -43 25
                0 3 26 22 58 41 74 45 137 103 168 157 14 23 52 70 84 103 33 34 62 70 65 81
                9 26 18 24 42 -8z m-1663 -16 c3 -19 22 -60 41 -91 19 -32 33 -62 30 -66 -3
                -5 -1 -12 5 -15 8 -5 8 -11 0 -19 -7 -10 -2 -24 19 -54 27 -37 84 -72 180
                -109 24 -9 23 -10 -22 -36 -64 -38 -105 -90 -178 -227 -35 -66 -66 -120 -69
                -120 -3 0 -19 21 -37 46 l-32 47 23 31 c42 55 56 94 56 150 0 49 -8 70 -64
                178 -92 177 -94 201 -18 281 44 46 58 47 66 4z m1199 -78 c-34 -59 -68 -79
                -135 -79 -51 0 -59 2 -56 18 2 10 11 16 23 15 11 -2 52 15 90 37 87 49 103 51
                78 9z m-687 -19 c42 -17 83 -29 90 -26 16 6 38 -19 29 -34 -8 -13 -95 -13
                -130 0 -26 10 -85 67 -85 82 0 13 16 9 96 -22z m523 -145 c12 -13 -120 -217
                -193 -298 l-35 -39 -46 39 c-67 54 -120 125 -161 211 -19 41 -34 75 -32 77 2
                1 30 6 63 10 l60 6 48 -79 c38 -62 53 -79 67 -75 10 3 27 0 38 -6 19 -10 25
                -4 68 80 l47 91 36 -7 c20 -4 38 -8 40 -10z"/>
                        </g>
                    </svg>
                
                    <div>
                        <p class="intro-section_label">Powered by</p>
                        <h1 class="intro-section_title">Lancelot.js</h1>
                    </div>
                </div>
            </div>
        `;

        hide(introSection);

    }

    _InitEvents() {
        
        this._mouse = { pressed: false, x: null, y: null };
        this._keys = new Set();

        const isTouchDevice = "ontouchstart" in document;

        if(isTouchDevice) {

            this._canvas.addEventListener("touchstart", (e) => this._HandleTouchEvent(e));
            this._canvas.addEventListener("touchmove", (e) => this._HandleTouchEvent(e));
            this._canvas.addEventListener("touchend", (e) => this._HandleTouchEvent(e));

        } else {

            this._canvas.addEventListener("mousedown", (e) => this._HandleMouseEvent(e));
            this._canvas.addEventListener("mousemove", (e) => this._HandleMouseEvent(e));
            this._canvas.addEventListener("mouseup", (e) => this._HandleMouseEvent(e));

        }

        window.addEventListener("keydown", (e) => this._HandleKeyEvent(e));
        window.addEventListener("keyup", (e) => this._HandleKeyEvent(e));

        this._canvas.onclick = () => {

            const scene = this._sceneManager._currentScene;
            if(!scene) { return; }

            scene._On("click");
        }
    }

    _CreateMouseEventObject = (x, y, identifier, scene) => {
        const coords = this.Display2SceneCoords(scene, x, y);
        return {
            x: coords.x,
            y: coords.y,
            id: identifier
        };
    }

    _HandleTouchEvent(e) {

        const scene = this._sceneManager._currentScene;
        if(!scene) { return; }

        const touch2MouseType = {
            "touchstart": "mousedown",
            "touchmove": "mousemove",
            "touchend": "mouseup"
        };

        for(let touch of e.changedTouches) {

            scene._On((touch2MouseType[e.type] || ""), this._CreateMouseEventObject(touch.pageX, touch.pageY, touch.identifier, scene));

        }
    }

    _HandleMouseEvent(e) {

        if(e.type == "mousedown") {
            this._mouse.pressed = true;
        } else if(e.type == "mouseup") {
            this._mouse.pressed = false;
        }

        const scene = this._sceneManager._currentScene;
        if(!scene) { return; }

        scene._On(e.type, this._CreateMouseEventObject(e.pageX, e.pageY, 0, scene));

    }

    _HandleKeyEvent(e) {

        if(e.type == "keydown") {
            this._keys.add(e.key);
        } else {
            this._keys.delete(e.key);
        }

        const scene = this._sceneManager._currentScene;
        if(!scene) { return; }

        scene._On(e.type, { key: e.key });
    }

    IsKeyPressed(k) {
        return this._keys.has(k);
    }

    IsMousePressed() {
        return this._mouse.pressed;
    }

    _OnResize() {
        const [width, height] = [document.body.clientWidth, document.body.clientHeight];
        if(width / height > this._aspect) {
            this._scale = height / this._height;
        } else {
            this._scale = width / this._width;
        }
        this._container.style.transform = "translate(-50%, -50%) scale(" + this._scale + ")";
        this._context.imageSmoothingEnabled = false;
    }
    
    Render() {

        const scene = this._sceneManager._currentScene;
        
        if(!scene) { return; }

        this._context.beginPath();
        this._context.fillStyle = this._bgColor;
        this._context.fillRect(0, 0, this._width, this._height);
        this._context.save();
        this._context.translate(-scene._camera.pos.x * scene._camera._scale + this._width / 2, -scene._camera.pos.y * scene._camera._scale + this._height / 2);
        this._context.scale(scene._camera._scale, scene._camera._scale);
        for(let elem of scene._drawable) {
            const pos = elem._pos.Clone();
            pos.Sub(scene._camera.pos);
            pos.Mult(scene._camera._scale);
            const [width, height] = [elem.width, elem.height].map((_) => _ * scene._camera._scale);
            if(
                pos.x + width / 2 < -this._width / 2 ||
                pos.x - width / 2 > this._width / 2 ||
                pos.y + height / 2 < -this._height / 2 ||
                pos.y - height / 2 > this._height / 2
            ) {
                continue;
            }
            elem.Draw(this._context);
        }
        this._context.restore();
    }

    Display2SceneCoords(scene, x, y) {
        const boundingRect = this.dimension;
        const scaledX = (x - boundingRect.left) / this._scale;
        const scaledY = (y - boundingRect.top) / this._scale;
        return {
            x: (scaledX - this._width / 2) / scene._camera._scale + scene._camera._pos.x,
            y: (scaledY - this._height / 2) / scene._camera._scale + scene._camera._pos.y
        };
    }
}

class SceneManager {
    constructor() {
        this._currentScene = null;
        this._scenes = new Map();
    }
    set currentScene(n) {
        this._currentScene = (this._scenes.get(n) || null);
    }
    Add(s, n) {
        this._scenes.set(n, s);
    }
    Play(n) {
        this.currentScene = n;
        if(this._currentScene) {
            this._currentScene.Play();
        }
        return this._currentScene;
    }
}

class Scene {
    constructor(params) {

        this._params = params;
        
        this._resources = params.resources;
        this._input = params.input;
        this._bounds = params.bounds;
        this._cellDimensions = (params.cellDimensions || [50, 50]);
        this._interactiveEntities = [];

        this._Init();
    }
    _Init() {
        this._paused = true;
        this._speed = 1.0;
        this._entityManager = new EntityManager();
        this._spatialGrid = new SpatialHashGrid(this._bounds, [Math.floor((this._bounds[1][0] - this._bounds[0][0]) / this._cellDimensions[0]), Math.floor((this._bounds[1][1] - this._bounds[0][1]) / this._cellDimensions[1])]);
        this._camera = new Camera();
        this._drawable = [];
        this._eventHandlers = new Map();
        this._interactive = [];

        const collisionsCleaner = new Entity();
        collisionsCleaner.AddComponent(new CollisionsCleanerController(this._entityManager._entities));
        this.AddEntity(collisionsCleaner);
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
    SetInteractive(entity, params) {
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
            const entities = this._spatialGrid.FindNear([event.x, event.y], [0, 0]).map(c => c.entity);
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
        e._components.forEach((c) => {
            if (c._type == "drawable") {
                this._AddDrawable(c);
            }
        });
        const body = e.GetComponent("Body");
        if (body) {
            e.body = body;
            const gridController = new SpatialGridController({
                grid: this._spatialGrid,
                width: body.width,
                height: body.height
            });
            e.AddComponent(gridController);
        }
    }
    RemoveEntity(e) {
        this._entityManager.Remove(e);
        e._components.forEach((c) => {
            if (c._type == "drawable") {
                this._RemoveDrawable(c);
            }
        });
        const gridController = e.GetComponent("SpatialGridController");
        if(gridController) {
            this._spatialGrid.RemoveClient(gridController._client);
        }
    }
    _AddDrawable(e) {
        this._drawable.push(e);
        for (let i = this._drawable.length - 1; i > 0; --i) {
            if (e._zIndex >= this._drawable[i - 1]._zIndex) {
                break;
            }
            [this._drawable[i], this._drawable[i - 1]] = [this._drawable[i - 1], this._drawable[i]];
        }
    }
    Play() {
        this._paused = false;
    }
    Pause() {
        this._paused = true;
    }
    _RemoveDrawable(e) {
        const i = this._drawable.indexOf(e);
        if (i > 0) {
            this._drawable.splice(i, 1);
        }
    }
    Update(elapsedTimeS) {
        if (this._paused) { return; }
        elapsedTimeS *= this._speed;
        this._entityManager.Update(elapsedTimeS);
        this._camera.Update(elapsedTimeS);
    }
}

class SpatialHashGrid {
    constructor(bounds, dimensions) {
        const [x, y] = dimensions;
        this._cells = [...Array(y)].map(_ => [...Array(x)].map(_ => (null)));
        this._dimensions = dimensions;
        this._bounds = bounds;
    }

    NewClient(position, dimensions) {
        const client = {
            position: position,
            dimensions: dimensions,
            indices: null
        };
        this._InsertClient(client);
        return client;
    }

    _InsertClient(client) {
        const [w, h] = client.dimensions;
        const [x, y] = client.position;

        const i1 = this._GetCellIndex([x - w / 2, y - h / 2]);
        const i2 = this._GetCellIndex([x + w / 2, y + h / 2]);

        client.indices = [i1, i2];

        for (let y = i1[1]; y <= i2[1]; ++y) {
            for (let x = i1[0]; x <= i2[0]; ++x) {

                if (!this._cells[y][x]) {
                    this._cells[y][x] = new Set();
                }

                this._cells[y][x].add(client);
            }
        }
    }

    _GetCellIndex(position) {
        const x = math.sat((position[0] - this._bounds[0][0]) / (this._bounds[1][0] - this._bounds[0][0]));
        const y = math.sat((position[1] - this._bounds[0][1]) / (this._bounds[1][1] - this._bounds[0][1]));
        const xIndex = Math.floor(x * (this._dimensions[0] - 1));
        const yIndex = Math.floor(y * (this._dimensions[1] - 1));

        return [xIndex, yIndex];
    }

    FindNear(position, bounds) {
        const [w, h] = bounds;
        const [x, y] = position;

        const i1 = this._GetCellIndex([x - w / 2, y - h / 2]);
        const i2 = this._GetCellIndex([x + w / 2, y + h / 2]);

        const clients = new Set();

        for (let y = i1[1]; y <= i2[1]; ++y) {
            for (let x = i1[0]; x <= i2[0]; ++x) {

                if (this._cells[y][x]) {
                    for (let v of this._cells[y][x]) {
                        clients.add(v);
                    }
                }
            }
        }
        return Array.from(clients);
    }

    UpdateClient(client) {
        this.RemoveClient(client);
        this._InsertClient(client);
    }

    RemoveClient(client) {
        const [i1, i2] = client.indices;

        for (let y = i1[1]; y <= i2[1]; ++y) {
            for (let x = i1[0]; x <= i2[0]; ++x) {
                this._cells[y][x].delete(client);
            }
        }
    }

}

class Camera {
    constructor() {
        this._pos = new Vector();
        this._scale = 1.0;
        this._target = null;
        this._vel = new Vector();
        this._scaling = null;
        this._moving = null;
        this._shaking = null;
        this._offset = new Vector();
    }
    get pos() {
        return this._pos.Clone().Add(this._offset);
    }
    get shaking() {
        return this._shaking;
    }
    get scaling() {
        return this._scaling;
    }
    get moving() {
        return this._moving;
    }
    Follow(target) {
        this._target = target;
    }
    Unfollow() {
        this._target = null;
    }
    SetPosition(p) {
        this._pos.Copy(p);
    }
    SetScale(s) {
        this._scale = s;
    }
    ScaleTo(s, dur, timing = "linear") {
        this._scaling = {
            counter: 0,
            dur: dur,
            from: this._scale,
            to: s,
            timing: timing
        };
    }
    MoveTo(p, dur, timing = "linear") {
        this._moving = {
            counter: 0,
            dur: dur,
            from: this._pos.Clone(),
            to: p,
            timing: timing
        };
    }
    Shake(range, dur, count, angle) {
        this._shaking = {
            counter: 0,
            count: count,
            angle: angle,
            dur: dur,
            range: range
        };
    }
    Reset() {
        this._pos = new Vector(0, 0);
        this._scale = 1.0;
        this._scaling = null;
        this._moving = null;
    }
    Update(elapsedTimeS) {

        if (this._moving) {
            const anim = this._moving;
            anim.counter += elapsedTimeS * 1000;
            const progress = Math.min(anim.counter / anim.dur, 1);
            let value;
            switch (anim.timing) {
                case "linear":
                    value = progress;
                    break;
                case "ease-in":
                    value = math.ease_in(progress);
                    break;
                case "ease-out":
                    value = math.ease_out(progress);
                    break;
            }
            this._pos.Copy(anim.from.Clone().Lerp(anim.to, value));
            if (progress == 1) {
                this._moving = null;
            }
        } else if (this._target) {
            if (Vector.Dist(this._pos, this._target._pos) < 1) {
                this._pos.Copy(this._target._pos);
            }
            else {
                const t = 4 * elapsedTimeS;
                this._pos.Lerp(this._target._pos, t);
            }
        } else {
            const vel = this._vel.Clone();
            vel.Mult(elapsedTimeS);
            this._pos.Add(vel);
        }

        if (this._scaling) {
            const anim = this._scaling;
            anim.counter += elapsedTimeS * 1000;
            const progress = Math.min(anim.counter / anim.dur, 1);
            let value;
            switch (anim.timing) {
                case "linear":
                    value = progress;
                    break;
                case "ease-in":
                    value = math.ease_in(progress);
                    break;
                case "ease-out":
                    value = math.ease_out(progress);
                    break;
            }
            this._scale = math.lerp(value, anim.from, anim.to);
            if (progress == 1) {
                this._scaling = null;
            }
        }

        if(this._shaking) {
            const anim = this._shaking;
            anim.counter += elapsedTimeS * 1000;
            const progress = Math.min(anim.counter / anim.dur, 1);
            this._offset.Copy(new Vector(Math.sin(progress * Math.PI * 2 * anim.count) * anim.range, 0).Rotate(anim.angle));
            if (progress == 1) {
                this._scaling = null;
            }
        }
        
    }
}

class EntityManager {
    constructor() {
        this._entities = [];
        this._entitiesMap = new Map();
        this._ids = 0;
    }
    _GenerateName() {
        ++this._ids;
        return "__entity__" + this._ids;
    }
    Add(e, n) {
        if (n === undefined) {
            n = this._GenerateName();
        }
        this._entities.push(e);
        this._entitiesMap.set(n, e);
        e._parent = this;
        e._name = n;
    }
    Get(n) {
        return this._entitiesMap.get(n);
    }
    Remove(e) {
        const i = this._entities.indexOf(e);
        if (i < 0) {
            return;
        }
        this._entities.splice(i, 1);
    }
    Filter(cb) {
        return this._entities.filter(cb);
    }
    Update(elapsedTimeS) {
        for (let e of this._entities) {
            e.Update(elapsedTimeS);
        }
    }
}

class Entity {
    constructor() {
        this._pos = new Vector(0, 0);
        this._components = new Map();
        this._parent = null;
        this._name = null;
        this._scene = null;
        this.groupList = new Set();

        const animator = new Animator();
        this.AddComponent(animator);
        this.animator = animator;
    }
    Update(elapsedTimeS) {
        this._components.forEach((c) => {
            c.Update(elapsedTimeS);
        });
    }
    AddComponent(c, n) {
        if (n === undefined) {
            n = c.constructor.name;
        }
        this._components.set(n, c);
        c._parent = this;
        c.InitComponent();
    }
    GetComponent(n) {
        return this._components.get(n);
    }
    SetPosition(p) {
        if(this.body && !this.body._fixed) {
            const offset = this.body._pos.Clone().Sub(this._pos);
            this.body.SetPosition(p.Clone().Add(offset));
        }
        this._pos.Copy(p);
    }
    FindEntity(n) {
        return this._parent.Get(n);
    }
}

class Component {
    constructor() {
        this._type = "";
        this._parent = null;
    }
    get scene() {
        return this._parent._scene;
    }
    InitComponent() { }
    GetComponent(n) {
        return this._parent.GetComponent(n);
    }
    FindEntity(n) {
        return this._parent.FindEntity(n);
    }
    Update(_) { }
}

class CollisionsCleanerController extends Component {
    constructor(entities) {
        super();
        this._entities = entities;
    }
    Update(_) {
        for(let e of this._entities) {
            const body = e.body;
            if(body) {
                body._collisions.left.clear();
                body._collisions.right.clear();
                body._collisions.top.clear();
                body._collisions.bottom.clear();
            }
        }
    }
}

class Interactive extends Component {
    constructor(params) {
        super();
        this._capture = params.capture;
        this._eventHandlers = new Map();
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
    _On(type, event) {
        if(!this._eventHandlers.has(type)) { return; }
        const handlers = this._eventHandlers.get(type);
        for(let handler of handlers) {
            handler(event);
        }
    }
}

class Animator extends Component {
    constructor() {
        super();
        this._moving = null;
    }
    MoveTo(p, dur, timing = "linear") {
        this._moving = {
            counter: 0,
            dur: dur,
            from: this._parent._pos.Clone(),
            to: p,
            timing: timing
        };
    }
    Update(elapsedTimeS) {
        if (this._moving) {
            const anim = this._moving;
            anim.counter += elapsedTimeS * 1000;
            const progress = Math.min(anim.counter / anim.dur, 1);
            let value;
            switch (anim.timing) {
                case "linear":
                    value = progress;
                    break;
                case "ease-in":
                    value = math.ease_in(progress);
                    break;
                case "ease-out":
                    value = math.ease_out(progress);
                    break;
            }
            this._parent.SetPosition(anim.from.Clone().Lerp(anim.to, value));
            if (progress == 1) {
                this._moving = null;
            }
        }
    }
}

class SpatialGridController extends Component {
    constructor(params) {
        super();
        this._params = params;
        this._width = this._params.width;
        this._height = this._params.height;
        this._grid = this._params.grid;

    }
    set width(val) {
        this._width = val;
        this._Reset();
    }
    set height(val) {
        this._height = val;
        this._Reset();
    }
    InitComponent() {
        const pos = [
            this._parent.body._pos.x,
            this._parent.body._pos.y
        ];
        this._client = this._grid.NewClient(pos, [this._width, this._height]);
        this._client.entity = this._parent;
    }
    _Reset() {
        this._grid.RemoveClient(this._client);
        this.InitComponent();
    }
    Update(_) {
        const pos = [
            this._parent.body._pos.x,
            this._parent.body._pos.y
        ];
        if (pos[0] == this._client.position[0] && pos[1] == this._client.position[1]) {
            return;
        }
        this._client.position = pos;
        this._grid.UpdateClient(this._client);
    }
    FindNearby(rangeX, rangeY) {
        const results = this._grid.FindNear(
            [this._parent._pos.x, this._parent._pos.y], [rangeX, rangeY]
        );
        return results.filter(c => c.entity != this._parent).map(c => c.entity);
    }
}

class Drawable extends Component {
    constructor(params) {
        super();
        this._type = "drawable";
        this._params = params;
        this._fixed = this._params.fixed === undefined ? true : this._params.fixed;
        this._zIndex = (this._params.zIndex || 0);
        this._flip = {
            x: (this._params.flipX || false),
            y: (this._params.flipY || false)
        };
        this._rotationCount = (this._params.rotationCount || 0);
        this._opacity = this._params.opacity !== undefined ? this._params.opacity : 1;
    }
    set zIndex(val) {
        this._zIndex = val;
        if(this.scene) {
            this.scene._RemoveDrawable(this);
            this.scene._AddDrawable(this);
        }
    }
    get width() {
        return 0;
    }
    get height() {
        return 0;
    }
    get angle() {
        return Math.PI / 2 * this._rotationCount;
    }
    InitComponent() {
        if(this._fixed) {
            this._pos = this._parent._pos;
        }
    }
    SetSize(w, h) {
        this._width = w;
        this._height = h;
    }
    Draw(_) { }
}

class Text extends Drawable {
    constructor(params) {
        super(params);
        this._text = this._params.text;
        this._lines = this._text.split(/\n/);
        this._padding = (this._params.padding || 0);
        this._fontSize = this._params.fontSize;
        this._fontFamily = (this._params.fontFamily || "Arial");
        this._color = (this._params.color || "black");

        this._ComputeDimensions();
    }
    get linesCount() {
        return this._lines.length;
    }
    get lineHeight() {
        return this._fontSize + this._padding * 2;
    }
    set text(val) {
        this._text = val;
        this._ComputeDimensions();
    }
    set fontSize(val) {
        this._fontSize = val;
        this._ComputeDimensions();
    }
    set fontFamily(val) {
        this._fontFamily = val;
        this._ComputeDimensions();
    }
    set padding(val) {
        this._padding = val;
        this._ComputeDimensions();
    }
    get width() {
        return this._rotationCount % 2 == 0 ? this._width : this._height;
    }
    get height() {
        return this._rotationCount % 2 == 1 ? this._width : this._height;
    }
    _ComputeDimensions() {
        this._height = this.lineHeight * this.linesCount;
        let maxWidth = 0;
        const ctx = document.createElement("canvas").getContext("2d");
        ctx.font = `${this._fontSize}px '${this._fontFamily}'`;
        for(let line of this._lines) {
            const lineWidth = ctx.measureText(line).width;
            if(lineWidth > maxWidth) {
                maxWidth = lineWidth;
            }
        }
        this._width = maxWidth;
    }
    Draw(ctx) {
        ctx.beginPath();
        ctx.save();
        ctx.globalAlpha = this._opacity;
        ctx.translate(this._pos.x, this._pos.y);
        ctx.rotate(this.angle);
        ctx.fillStyle = this._color;
        ctx.font = `${this._fontSize}px '${this._fontFamily}'`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        for(let i = 0; i < this.linesCount; ++i) {
            ctx.fillText(this._lines[i], 0, this.lineHeight * i - (this.linesCount - 1) / 2 * this.lineHeight);
        }
        ctx.restore();
    }
}

class Picture extends Drawable {
    constructor(params) {
        super(params);
        this._width = this._params.width;
        this._height = this._params.height;
        this._image = this._params.image;
        this._frameWidth = (this._params.frameWidth || this._image.width);
        this._frameHeight = (this._params.frameHeight || this._image.height);
        this._framePos = {
            x: (this._params.posX || 0),
            y: (this._params.posY || 0)
        };
    }
    get width() {
        return this._rotationCount % 2 == 0 ? this._width : this._height;
    }
    get height() {
        return this._rotationCount % 2 == 1 ? this._width : this._height;
    }
    Draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this._opacity;
        ctx.translate(this._pos.x, this._pos.y);
        ctx.scale(this._flip.x ? -1 : 1, this._flip.y ? -1 : 1);
        ctx.rotate(this.angle);
        ctx.drawImage(this._image, this._framePos.x * this._frameWidth, this._framePos.y * this._frameHeight, this._frameWidth, this._frameHeight, -this._width / 2, -this._height / 2, this._width, this._height);
        ctx.restore();
    }
}

class Rect extends Drawable {
    constructor(params) {
        super(params);
        this._width = this._params.width;
        this._height = this._params.height;
        this._background = (this._params.background || "black");
        this._borderColor = (this._params.borderColor || "black");
        this._borderWidth = (this._params.borderWidth || 0);
    }
    get width() {
        return this._rotationCount % 2 == 0 ? this._width : this._height;
    }
    get height() {
        return this._rotationCount % 2 == 1 ? this._width : this._height;
    }
    Draw(ctx) {
        ctx.beginPath();
        ctx.save();
        ctx.globalAlpha = this._opacity;
        ctx.translate(this._pos.x, this._pos.y);
        ctx.rotate(this.angle);
        ctx.fillStyle = this._background;
        ctx.strokeStyle = this._borderColor;
        ctx.lineWidth = this._borderWidth;
        ctx.rect(-this._width / 2, -this._height / 2, this._width, this._height);
        ctx.fill();
        if(this._borderWidth > 0) ctx.stroke();
        ctx.restore();
    }
}

class Sprite extends Drawable {
    constructor(params) {
        super(params);
        this._width = this._params.width;
        this._height = this._params.height;
        this._anims = {};
        this._currentAnim = null;
        this._paused = true;
        this._framePos = {x: 0, y: 0};
    }
    get width() {
        return this._rotationCount % 2 == 0 ? this._width : this._height;
    }
    get height() {
        return this._rotationCount % 2 == 1 ? this._width : this._height;
    }
    AddAnim(n, frames) {
        this._anims[n] = frames;
    }
    PlayAnim(n, rate, repeat, OnEnd) {
        if(this.currentAnim == n) { return; }
        this._paused = false;
        const currentAnim = {
            name: n,
            rate: rate,
            repeat: repeat,
            OnEnd: OnEnd,
            frame: 0,
            counter: 0
        }
        this._currentAnim = currentAnim;
        this._framePos = this._anims[currentAnim.name][currentAnim.frame];
    }
    Reset() {
        if(this._currentAnim) {
            this._currentAnim.frame = 0;
            this._currentAnim.counter = 0;
        }
    }
    Pause() {
        this._paused = true;
    }
    Resume() {
        if(this._currentAnim) {
            this._paused = false;
        }
    }
    Update(timeElapsed) {
        if(this._paused) {
            return;
        }
        const currentAnim = this._currentAnim;
        currentAnim.counter += timeElapsed * 1000;
        if(currentAnim.counter >= currentAnim.rate) {
            currentAnim.counter = 0;
            ++currentAnim.frame;
            if(currentAnim.frame >= this._anims[currentAnim.name].length) {
                currentAnim.frame = 0;
                if(currentAnim.OnEnd) {
                    currentAnim.OnEnd();
                }
                if(!currentAnim.repeat) {
                    this._currentAnim = null;
                    this._paused = true;
                }
            }
            this._framePos = this._anims[currentAnim.name][currentAnim.frame];
        }
    }
    get currentAnim() {
        if(this._currentAnim) {
            return this._currentAnim.name;
        }
        return null;
    }
    Draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this._opacity;
        ctx.translate(this._pos.x, this._pos.y);
        ctx.scale(this._flip.x ? -1 : 1, this._flip.y ? -1 : 1);
        ctx.rotate(this.angle);
        ctx.drawImage(
            this._params.image,
            this._framePos.x * this._params.frameWidth, this._framePos.y * this._params.frameHeight, this._params.frameWidth, this._params.frameHeight,  
            -this._width / 2, -this._height / 2, this._width, this._height
        );
        ctx.restore();
    }
}

class TrailEffect extends Drawable {
    constructor(params) {
        super(params);
        this._dur = (this._params.dur || 1000);
        this._lineWidth = (this._params.lineWidth || 5);
        this._rgb = (this._params.rgb || [255, 255, 255]);
        this._frames = [];
        this._width = (this._params.width || 100);
        this._height = (this._params.height || 100);
    }
    get width() {
        return this._width;
    }
    get height() {
        return this._height;
    }
    Update(elapsedTimeS) {
        this._frames.unshift({ pos: this._pos.Clone(), counter: 0 });
        for(let i = 0; i < this._frames.length; ++i) {
            this._frames[i].counter += elapsedTimeS * 1000;
            if(this._frames[i].counter >= this._dur) {
                this._frames.splice(i--, 1);
            }
        }
    }
    Draw(ctx) {
        ctx.save();
        for(let i = 0; i < this._frames.length - 1; ++i) {
            const pos1 = this._frames[i].pos;
            const pos2 = this._frames[i + 1].pos;
            
            const grd = ctx.createLinearGradient(pos1.x, pos1.y, pos2.x, pos2.y);
            grd.addColorStop(0, `rgba(${this._rgb.join(",")},${(this._count - i) / this._count})`);
            grd.addColorStop(1, `rgba(${this._rgb.join(",")},${(this._count - i - 1) / this._count})`);
            
            ctx.beginPath();
            ctx.strokeStyle = grd;
            ctx.lineWidth = (this._count - i) / this._count * this._lineWidth + 1;
            ctx.lineCap = "round";
            ctx.moveTo(pos1.x, pos1.y);
            ctx.lineTo(pos2.x, pos2.y);
            ctx.stroke();
        }
        ctx.restore();
    }
}

class Body extends Component {
    constructor(params) {
        super();
        this._params = params;
        this._fixed = this._params.fixed === undefined ? true : this._params.fixed;
        this._pos = new Vector();
        this._oldPos = new Vector();
        this._vel = new Vector();
        this._passiveVel = new Vector();
        this._friction = {
            x: (this._params.frictionX || 0),
            y: (this._params.frictionY || 0)
        };
        this._bounce = (this._params.bounce || 0);
        this._decceleration = new Vector(-100 * this._friction.x, -100 * this._friction.y);
        this._mass = (this._params.mass || 0);
        this._collisions = {left: new Set(), right: new Set(), top: new Set(), bottom: new Set()};
        this._options = {
            followBottomObject: (this._params.followBottomObject || false)
        };
        this._behavior = [];
    }
    get inverseMass() {
        return this._mass === 0 ? 0 : 1 / this._mass;
    }
    get width() {
        return 0;
    }
    get height() {
        return 0;
    }
    InitComponent() {
        if(this._fixed) {
            this._pos = this._parent._pos;
        }
        this._oldPos.Copy(this._pos);
    }
    SetPosition(p) {
        this._pos.Copy(p);
        this._oldPos.Copy(p);
    }
    SetVelocity(vel) {
        this._vel.Copy(vel);
    }
    AddBehavior(type, group, action) {
        this._behavior.push({ type: type, action: action, group: group });
    }
    Contains(p) {
        return false;
    }
    Update(elapsedTimeS) {

        const frameDecceleration = new Vector(this._vel.x * this._decceleration.x, this._vel.y * this._decceleration.y);
        
        this._oldPos.Copy(this._pos);
        this._vel.Add(frameDecceleration.Mult(elapsedTimeS));

        this._pos.Add(this._vel.Clone().Mult(elapsedTimeS));
        this._pos.Add(this._passiveVel.Clone().Mult(elapsedTimeS));
        

        const gridController = this.GetComponent("SpatialGridController");
        for(let obj of this._behavior) {
            const entities = gridController.FindNearby(this.width + Math.abs(this._pos.x - this._oldPos.x), this.height + Math.abs(this._pos.y - this._oldPos.y)).filter(e => e.groupList.has(obj.group));
            entities.sort((a, b) => Vector.Dist(this._pos, a.body._pos) / new Vector(this.width + a.body.width, this.height + a.body.height).Mag() - Vector.Dist(this._pos, b.body._pos) / new Vector(this.width + b.body.width, this.height + b.body.height).Mag());
            for(let e of entities) {
                if(obj.type == "resolveCollision") {
                    if(physics.ResolveCollision(this, e.body)) {
                        if(obj.action) obj.action();
                    }
                } else if(obj.type == "isCollision") {
                    if(physics.DetectCollision(this, e.body)) {
                        obj.action();
                    }
                }
            }
        }

    }

}

class Box extends Body {
    constructor(params) {
        super(params);
        this._width = params.width;
        this._height = params.height;
        this._edges = (params.edges || [1, 1, 1, 1]);
    }
    get width() {
        return this._width;
    }
    get height() {
        return this._height;
    }
    set width(val) {
        this._width = val;
        this.GetComponent("SpatialGridController").width = this.width;
    }
    set height(val) {
        this._height = val;
        this.GetComponent("SpatialGridController").height = this.height;
    }
    get left() {
        return this._pos.x - this._width / 2;
    }
    get right() {
        return this._pos.x + this._width / 2;
    }
    get top() {
        return this._pos.y - this._height / 2;
    }
    get bottom() {
        return this._pos.y + this._height / 2;
    }
    get oldLeft() {
        return this._oldPos.x - this._width / 2;
    }
    get oldRight() {
        return this._oldPos.x + this._width / 2;
    }
    get oldTop() {
        return this._oldPos.y - this._height / 2;
    }
    get oldBottom() {
        return this._oldPos.y + this._height / 2;
    }
    Contains(p) {
        return Math.abs(p.x - this._pos.x) < this._width / 2 && Math.abs(p.y - this._pos.y) < this._height / 2;
    }
}

const ResolveCollisionBoxVsBox = (b1, b2) => {

    if(b1._mass == 0 && b2._mass == 0) { return; }
    const SMALL_NUMBER = 0.0001;
    
    const vec1 = b1._pos.Clone().Sub(b1._oldPos);
    const vec2 = b2._pos.Clone().Sub(b2._oldPos);

    let relationX, relationY;
    if(b1.oldRight <= b2.oldLeft) relationX = 1;
    else if(b1.oldLeft >= b2.oldRight) relationX = -1;
    else relationX = 0;
    if(b1.oldBottom <= b2.oldTop) relationY = 1;
    else if(b1.oldTop >= b2.oldBottom) relationY = -1;
    else relationY = 0;

    let collided = false;

    if(b1._mass != 0 && b2._mass != 0) {

        if(Math.abs(b1._pos.x - b2._pos.x) < (b1._width + b2._width) / 2 && Math.abs(b1._pos.y - b2._pos.y) < (b1._height + b2._height) / 2) {
            
            collided = true;
            
            if(relationX == 0) {
                const diff = ((b1._height + b2._height) / 2 - (b2._pos.y - b1._pos.y)) / (b1.inverseMass + b2.inverseMass);
                b1._pos.y -= diff * b1.inverseMass;
                b1._oldPos.y = b1._pos.y;
                b2._pos.y += diff * b2.inverseMass;
                b2._oldPos.y = b2._pos.y;
            } else {
                const diff = ((b1._width + b2._width) / 2 - (b2._pos.x - b1._pos.x)) / (b1.inverseMass + b2.inverseMass);
                b1._pos.x -= diff * b1.inverseMass;
                b1._oldPos.x = b1._pos.x;
                b2._pos.x += diff * b2.inverseMass;
                b2._oldPos.x = b2._pos.x;
            }
        }

    }

    if(relationY != 0 && collided == false) {

        const offsetY = relationY * (b1._height + b2._height) / 2;
        const dy = vec2.y - vec1.y;
        const t = (b1._oldPos.y - b2._oldPos.y + offsetY) / (dy);

        if(t >= 0 && t <= 1) {

            if(Math.abs(b1._oldPos.x - b2._oldPos.x + (vec1.x - vec2.x) * t) < (b1._width + b2._width) / 2) {

                collided = true;

                const [t, b] = relationY == 1 ? [b1, b2] : [b2, b1];

                if(b._mass == 0) {

                    if((t._vel.y >= -t._passiveVel.y || t._vel.y >= 0)) {
                        t._oldPos.y = t._pos.y = b.top - t._height / 2 - SMALL_NUMBER;
                        if(t._vel.y > 0) t._vel.y *= -t._bounce;
                        if(t._options.followBottomObject) {
                            t._passiveVel.Copy(b._vel);
                        }
                    }
                    
                } else if(t._mass == 0) {

                    if((b._vel.y <= -b._passiveVel.y || b._vel.y <= 0)) {
                        b._oldPos.y = b._pos.y = t.bottom + b._height / 2 + SMALL_NUMBER;
                        if(b._vel.y < 0) b._vel.y *= -b._bounce;
                    }
                }

                t._collisions.bottom.add(b);
                b._collisions.top.add(t);

            }
        }
    }

    if(relationX != 0 && collided == false) {

        const offsetX = relationX * (b1._width + b2._width) / 2;
        const dx = vec2.x - vec1.x;
        let t = (b1._oldPos.x - b2._oldPos.x + offsetX) / (dx);

        if(t >= 0 && t <= 1) {

            if(Math.abs(b1._oldPos.y - b2._oldPos.y + (vec1.y - vec2.y) * t) < (b1._height + b2._height) / 2) {

                collided = true;

                const [l, r] = relationX == 1 ? [b1, b2] : [b2, b1];

                

                if(r._mass == 0) {

                    if((l._vel.x >= -l._passiveVel.x || l._vel.x >= 0)) {
                        l._oldPos.x = l._pos.x = r.left - l._width / 2 - SMALL_NUMBER;
                        if(l._vel.x > 0) l._vel.x *= -l._bounce;
                    }
                } else if(l._mass == 0) {

                    if((r._vel.x <= -r._passiveVel.x || r._vel.x <= 0)) {
                        r._oldPos.x = r._pos.x = l.right + r._width / 2 + SMALL_NUMBER;
                        if(r._vel.x < 0) r._vel.x *= -r._bounce;
                    }
                }

                l._collisions.right.add(r);
                r._collisions.left.add(l);
            }
        }
    }

    return collided;
    
}

const ResolveCollision = (b1, b2) => {
    if(b1.constructor.name == "Box" && b2.constructor.name == "Box") {
        return ResolveCollisionBoxVsBox(b1, b2);
    }
    return false;
}

const DetectCollisionBoxVsBox = (b1, b2) => {
    return Math.abs(b1._pos.x - b2._pos.x) < (b1._width + b2._width) / 2 &&
        Math.abs(b1._pos.y - b2._pos.y) < (b1._height + b2._height) / 2;
}

const DetectCollision = (b1, b2) => {
    if(b1.constructor.name == "Box" && b2.constructor.name == "Box") {
        return DetectCollisionBoxVsBox(b1, b2);
    } else {
        return false;
    }
}

class Loader {
    constructor() {
        this._toLoad = [];
        this._size = 0;
        this._counter = 0;
        this._path = "";
    }
    _Add(n, p, type) {
        this._toLoad.push({
            name: n,
            path: this._path + "/" + p,
            type: type
        });
        ++this._size;
    }
    AddImage(n, p) {
        this._Add(n, p, "image");
        return this;
    }
    AddAudio(n, p) {
        this._Add(n, p, "audio");
        return this;
    }
    AddJSON(n, p) {
        this._Add(n, p, "json");
        return this;
    }
    AddFont(n, p) {
        this._Add(n, p, "font");
        return this;
    }
    _HandleCallback(loaded, obj, e, cb) {
        loaded.set(obj.name, e);
        ++this._counter;
        this._HandleOnProgress(obj);
        if (this._counter === this._size) {
            this._counter = this._size = 0;
            this._toLoad = [];
            cb(loaded);
        }
    }
    _OnProgressHandler(value, obj) {}
    OnProgress(f) {
        this._OnProgressHandler = f;
        return this;
    }
    SetPath(p) {
        this._path = p;
        return this;
    }
    _HandleOnProgress(obj) {
        const value = this._counter / this._size;
        this._OnProgressHandler(value, obj);
    }
    Load(cb) {
        const loaded = new Map();
        if(this._size === 0) {
            cb(loaded);
            return;
        }
        for (let e of this._toLoad) {
            switch (e.type) {
                case "image":
                    Loader.LoadImage(e.path, (elem) => {
                        this._HandleCallback(loaded, e, elem, cb);
                    });
                    break;
                case "audio":
                    Loader.LoadAudio(e.path, (elem) => {
                        this._HandleCallback(loaded, e, elem, cb);
                    });
                    break;
                case "json":
                    Loader.LoadJSON(e.path, (elem) => {
                        this._HandleCallback(loaded, e, elem, cb);
                    });
                    break;
                case "font":
                    Loader.LoadFont(e.name, e.path, (elem) => {
                        this._HandleCallback(loaded, e, elem, cb);
                    });
            }
        }
    }
    static LoadImage(p, cb) {
        const image = new Image();
        image.src = p;
        image.addEventListener("load", () => {
            cb(image);
        }, { once: true });
    }
    static LoadAudio(p, cb) {
        const audio = new Audio(p);
        audio.load();
        audio.addEventListener("canplaythrough", () => {
            cb(audio);
        }, { once: true });
    }
    static LoadJSON(p, cb) {
        fetch(p)
            .then(response => response.json())
            .then(json => cb(json));
    }
    static LoadFont(n, p, cb) {
        const font = new FontFace(n, `url(${p})`);
        font
            .load()
            .then((loadedFont) => {
            document.fonts.add(loadedFont);
            cb(n);
        });
    }
}

const drawable = {
    Drawable,
    Text,
    Picture,
    Rect,
    Sprite,
    TrailEffect
};

const physics = {
    Box,
    DetectCollision,
    ResolveCollision
};

export {
    Engine,
    Renderer,
    Component,
    Entity,
    SceneManager,
    Scene,
    Loader,
    drawable,
    physics,
    Vector,
    math,
    css, 
    id, 
    show, 
    hide
}