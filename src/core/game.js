import { AudioSection } from "./audio-manager.js";
import { Engine } from "./engine.js";
import { Renderer } from "./renderer.js";
import { SceneManager } from "./scene-manager.js";
import { Scene } from "./scene.js";
import { Loader } from "./loader.js";
import { ParamParser } from "./utils/param-parser.js";
import { Vector } from "./utils/vector.js";

export class Game {
    constructor(params) {
        this._width = params.width;
        this._height = params.height;
        this._preload = params.preload == undefined ? null : params.preload.bind(this);
        this._init = params.init.bind(this);
        this._parentElement = ParamParser.ParseValue(params.parentElement, document.body);

        this._resources = null;

        this._loader = new Loader();

        const body = this._parentElement;

        body.style.userSelect = "none";
        body.style.touchAction = "none";
        body.style.WebkitUserSelect = "none";
        body.style.position = "relative";
        /*body.style.width = "100%";
        body.style.height = "100%";*/
        body.style.overflow = "hidden";
        /*body.style.margin = "0";*/
        /*body.style.padding = "0";*/
        body.style.background = "black";

        this._renderer = new Renderer({
            width: this._width,
            height: this._height,
            parentElement: body
        });
        this._engine = new Engine();
        this._sceneManager = new SceneManager();

        const controls = ParamParser.ParseObject(params.controls, {
            active: false,
            layout: {
                joystick: { left: "ArrowLeft", right: "ArrowRight", up: "ArrowUp", down: "ArrowDown" },
                X: "e",
                Y: "d",
                A: "s",
                B: "f",
                SL: "Control",
                SR: "Control",
                start: " ",
                select: "Tab"
            }
        });
        if(controls.active && "ontouchstart" in document) {
            this._InitControls(controls.layout);
        }

        this.timeout = this._engine.timeout;
        this.audio = (() => {
            const sections = new Map();
            const CreateSection = (n) => {
                sections.set(n, new AudioSection());
            }
            const Play = (sectionName, audioName, params = {}) => {
                if(!sections.has(sectionName)) {
                    CreateSection(sectionName);
                }
                const section = sections.get(sectionName);
                if(!section._audioMap.has(audioName)) {
                    section.AddAudio(audioName, this._resources.get(audioName));
                }
                if(params.primary === false) {
                    section.PlaySecondary(audioName);
                } else {
                    section.Play(audioName, params);
                }
            }
            const Pause = (sectionName) => {
                sections.get(sectionName).Pause();
            }
            const SetVolume = (sectionName, volume) => {
                if(!sections.has(sectionName)) {
                    CreateSection(sectionName);
                }
                sections.get(sectionName).volume = volume;
            }
            const IsPlaying = (sectionName) => {
                return sections.get(sectionName).playing;
            }
            const GetVolume = (sectionName) => {
                if(!sections.has(sectionName)) {
                    CreateSection(sectionName);
                }
                return sections.get(sectionName).volume;
            }
            return {
                Play,
                Pause,
                SetVolume,
                IsPlaying,
                GetVolume
            };
        })();

        

        const step = (elapsedTime) => {
            for(let scene of this._sceneManager._scenes) {
                scene.Update(elapsedTime * 0.001);
            }
            
            this._renderer.Render(this._sceneManager._scenes);
        }

        this._engine._step = step;
        this._InitSceneEvents();

        this._engine.Start();

        if(this._preload) {
            this._preload();
            this._loader.Load((data) => {
                this._resources = data;
                this._init();
            });
        } else {
            this._resources = new Map();
            this._init();
        }

    }
    get loader() {
        return this._loader;
    }
    get resources() {
        return this._resources;
    }
    _InitControls(layout) {
        const applyStyle = (elem, bg = true) => {
            const color = "rgba(150, 150, 150, 0.6)";
            elem.style.pointerEvents = "auto";
            elem.style.position = "absolute";
            elem.style.border = "2px solid " + color;
            elem.style.color = color;
            //elem.style.fontSize = "24px";
            elem.style.fontFamily = "Arial";
            //elem.style.fontWeight = "500";
            elem.style.display = "flex";
            elem.style.alignItems = "center";
            elem.style.justifyContent = "center";
            //elem.style.borderRadius = "50%";
            if(bg) elem.style.background = "radial-gradient(circle at center, " + color + " 0, rgba(0, 0, 0, 0.6) 60%)";
        }

        const createButton = (right, bottom, text) => {
            const button = document.createElement("div");
            button.style.width = "46px";
            button.style.height = "46px";
            button.style.right = right - 5 + "px";
            button.style.bottom = bottom + 10 + "px";
            button.textContent = text;
            button.style.borderRadius = "50%";
            button.style.fontSize = "22px";
            applyStyle(button);
            controlsContainer.appendChild(button);
            return button;
        }

        const createSideButton = (side) => {
            const button = document.createElement("div");
            button.style.width = "46px";
            button.style.height = "46px";
            button.style.bottom = 190 + "px";
            button.style.fontSize = "22px";
            if(side == "left") {
                button.style.left = 5 + "px";
                button.textContent = "L";
                button.style.borderRadius = "50% 0 0 50%";
            } else if(side == "right") {
                button.style.right = 5 + "px";
                button.textContent = "R";
                button.style.borderRadius = "0 50% 50% 0";
            }
            
            applyStyle(button);
            controlsContainer.appendChild(button);
            return button;
        }

        const createActionButton = (text) => {
            const button = document.createElement("div");
            button.style.width = "50px";
            button.style.height = "22px";
            if(text == "Start") {
                button.style.left = "calc(50% + " + 3 + "px)";
            } else if(text == "Select") {
                button.style.right = "calc(50% + " + 3 + "px)";
            }
            button.style.bottom = 20 + "px";
            button.textContent = text;
            button.style.borderRadius = "12px";
            button.style.fontSize = "12px";
            button.style.fontWeight = "bolder";
            applyStyle(button);
            controlsContainer.appendChild(button);
            return button;
        }

        const controlsContainer = document.createElement("div");
        controlsContainer.style.width = "100%";
        controlsContainer.style.height = "100%";
        controlsContainer.style.left = "0";
        controlsContainer.style.top = "0";
        controlsContainer.style.zIndex = "999";
        controlsContainer.style.position = "absolute";
        controlsContainer.style.pointerEvents = "none";

        const controlsMap = {};

        const joystick = document.createElement("div");
        joystick.style.width = "120px";
        joystick.style.height = "120px";
        joystick.style.left = "10px";
        joystick.style.bottom = "50px";
        joystick.style.borderRadius = "50%";
        joystick.style.overflow = "hidden";
        applyStyle(joystick);
        controlsContainer.appendChild(joystick);

        for(let i = 0; i < 4; ++i) {
            const box = document.createElement("div");
            box.style.width = "120px";
            box.style.height = "120px";
            box.style.left = (-75 + 150 * (i % 2)) + "px";
            box.style.top = (-75 + 150 * Math.floor(i / 2)) + "px";
            applyStyle(box, false);
            joystick.appendChild(box);
        }

        controlsMap.joystick = joystick;
        controlsMap.A = createButton(10, 63, "A");
        controlsMap.B = createButton(63, 10, "B");
        controlsMap.X = createButton(63, 116, "X");
        controlsMap.Y = createButton(116, 63, "Y");

        controlsMap.SL = createSideButton("left");
        controlsMap.SR = createSideButton("right");

        controlsMap.select = createActionButton("Select", -20);
        controlsMap.start = createActionButton("Start", 20);

        this._parentElement.appendChild(controlsContainer);

        const getJoystickDirection = (e) => {
            const directions = {
                left: new Vector(-1, 0),
                right: new Vector(1, 0),
                top: new Vector(0, -1),
                bottom: new Vector(0, 1),
            };
            const target = joystick.getBoundingClientRect();
            const x = e.changedTouches[0].pageX - (target.left + target.width / 2);
            const y = e.changedTouches[0].pageY - (target.top + target.height / 2);
            const pos = new Vector(x, y);
            if(pos.Mag() < 20) return [];
            const n = pos.Clone().Unit();
            const res = [];
            if(Vector.Dot(n, directions.left) >= 0.5) {
                res.push("left");
            }
            if(Vector.Dot(n, directions.right) >= 0.5) {
                res.push("right");
            }
            if(Vector.Dot(n, directions.top) >= 0.5) {
                res.push("up");
            }
            if(Vector.Dot(n, directions.bottom) >= 0.5) {
                res.push("down");
            }
            return res;
        }

        const handleJoystick = (ev, dirs, keys) => {
            for(let dir of dirs) {
                this._HandleSceneEvent(ev, {
                    key: keys[dir]
                });
            }
        };

        for(let attr in controlsMap) {
            const elem = controlsMap[attr];
            const key = layout[attr];

            if(attr == "joystick") {
                elem.addEventListener("touchstart", (e) => {
                    const dirs = getJoystickDirection(e);
                    handleJoystick("keydown", dirs, key);
                });
                elem.addEventListener("touchmove", (e) => {
                    handleJoystick("keyup", ["left", "right", "up", "down"], key);
                    const dirs = getJoystickDirection(e);
                    handleJoystick("keydown", dirs, key);
                });
                elem.addEventListener("touchend", (e) => {
                    const dirs = getJoystickDirection(e);
                    handleJoystick("keyup", ["left", "right", "up", "down"], key);
                });
                continue;
            }
            elem.addEventListener("touchstart", () => {
                this._HandleSceneEvent("keydown", {
                    key: key
                });
            });
            elem.addEventListener("touchend", () => {
                this._HandleSceneEvent("keyup", {
                    key: key
                });
            });
        }
    }
    RequestFullScreen() {
        const element = this._parentElement;
        var requestMethod = element.requestFullScreen || element.webkitRequestFullScreen;
    
        if (requestMethod) {
            requestMethod.call(element);
        } else if (typeof window.ActiveXObject !== "undefined") {
            var wscript = new ActiveXObject("WScript.Shell");
            if (wscript !== null) {
                wscript.SendKeys("{F11}");
            }
        }
    }
    _InitSceneEvents() {
          

        const isTouchDevice = "ontouchstart" in document;
        const cnv = this._renderer._canvas;

        if(isTouchDevice) {

            cnv.addEventListener("touchstart", (e) => this._HandleTouchEvent(e));
            cnv.addEventListener("touchmove", (e) => this._HandleTouchEvent(e));
            cnv.addEventListener("touchend", (e) => this._HandleTouchEvent(e));

        } else {

            cnv.addEventListener("mousedown", (e) => this._HandleMouseEvent(e));
            cnv.addEventListener("mousemove", (e) => this._HandleMouseEvent(e));
            cnv.addEventListener("mouseup", (e) => this._HandleMouseEvent(e));

        }

        addEventListener("keydown", (e) => this._HandleKeyEvent(e));
        addEventListener("keyup", (e) => this._HandleKeyEvent(e));

    }
    _HandleKeyEvent(e) {
        this._HandleSceneEvent(e.type, {
            key: e.key
        });
    }
    _HandleTouchEvent(e) {

        const touchToMouseType = {
            "touchstart": "mousedown",
            "touchmove": "mousemove",
            "touchend": "mouseup"
        };

        this._HandleSceneEvent(touchToMouseType[e.type], {
            x: e.changedTouches[0].pageX, y: e.changedTouches[0].pageY
        });
    }
    _HandleMouseEvent(e) {

        this._HandleSceneEvent(e.type, {
            x: e.pageX, y: e.pageY
        });
    }
    _HandleSceneEvent(type, params0) {
        for(let scene of this._sceneManager._scenes) {

            const params = Object.assign({}, params0);
            
            if(type.startsWith("mouse")) {
                const coords = this._renderer.DisplayToSceneCoords(scene, params.x, params.y);
                params.x = coords.x;
                params.y = coords.y;
                
            }
            
            if(scene._On(type, params)) {
               break;
            }
        }
    }
    CreateSection(id) {
        const section = document.createElement("div");
        section.id = id;
        section.style.position = "absolute";
        section.style.left = "0";
        section.style.top = "0";
        section.style.width = "100%";
        section.style.height = "100%";
        section.style.display = "none";
        this._renderer._container.appendChild(section);
        return section;
    }
    GetSection(id) {
        return document.getElementById(id);
    }
    ShowSection(id) {
        this.GetSection(id).style.display = "block";
    }
    HideSection(id) {
        this.GetSection(id).style.display = "none";
    }
    CreateScene(n, params = {}) {
        const scene = new Scene(params);
        scene.resources = this._resources;
        this._sceneManager.Add(scene, n, (params.zIndex || 0));
        return scene;
    }
    PlayScene(n) {
        return this._sceneManager.Play(n);
    }
}