import { Loader } from "../utils/Loader.js";
import { paramParser } from "../utils/ParamParser.js";
import { Engine } from "./Engine.js";
import { Renderer } from "./Renderer.js";
import { SceneManager } from "./SceneManager.js";
import { Vector } from "../utils/Vector.js";
import { TimeoutHandler } from "../utils/TimeoutHandler.js";
import { math } from "../utils/Math.js";
import { AudioManager } from "../utils/AudioManager.js";

/**
 * Button layout
 * 
 * @typedef {Object} Layout
 * @property {Object} DPad
 * @property {string} DPad.up
 * @property {string} DPad.right
 * @property {string} DPad.down
 * @property {string} Pad.left
 * @property {string} X_Button
 * @property {string} Y_Button
 * @property {string} A_Button
 * @property {string} B_Button
 * @property {string} START_Button
 * @property {string} SELECT_Button
 * @property {string} R_Button
 * @property {string} L_Button
 */

/**
 * @typedef {function(): void} Callback
 * @this Game
 */

/**
 * @class Game
 */
export class Game {

    /** @type {Map<string, any>?} */
    _resources = null;
    _config;
    _width;
    _height;
    _init;
    _preload;
    _parentElement;
    _renderer;
    _load = new Loader();
    _sceneManager = new SceneManager();
    _engine;
    _timeout = new TimeoutHandler();
    _audio = null;
    _quality;

    /**
     * @param {Object} config
     * @param {number} config.width
     * @param {number} config.height
     * @param {number} config.quality
     * @param {Callback} config.init
     * @param {Callback} [config.preload]
     * @param {Object} config.controls
     * @param {boolean} config.controls.active
     * @param {Layout} config.controls.layout
     * @param {HTMLElement} [config.parentElement]
     */
    constructor(config) {
        this._config = config;
        this._width = config.width;
        this._height = config.height;
        this._quality = paramParser.parseValue(config.quality, 1.0);

        this._init = config.init.bind(this);

        /** @type {Callback} */
        let preload;
        if((preload = paramParser.parseValue(config.preload, null)) !== null) {
            this._preload = preload.bind(this);
        }

        this._parentElement = paramParser.parseValue(config.parentElement, document.body);

        const elem = this._parentElement;
        elem.style.WebkitUserSelect = "none";
        elem.style.userSelect = "none";
        elem.style.touchAction = "none";
        elem.style.overflow = "hidden";

        this._renderer = new Renderer(this._width, this._height, this._quality, this._parentElement);

        const step = (elapsedTime) => {
            this._timeout.update(elapsedTime);
            const scenes = this._sceneManager.scenes;
            for(let scene of scenes) {
                scene._update(elapsedTime * 0.001);
            }
            this._renderer.render(scenes);
        }

        this._engine = new Engine(step);

        this._initEventListeners();
        this._initControls();

        this._engine.start();

        if(this._preload) {
            this._preload();
            this._load.load((data) => {
                this._resources = data;
                this._audio = new AudioManager(this._resources);
                this._init();
            });
        } else {
            this._init();
        }
    }

    get width() {
        return this._width;
    }

    get height() {
        return this._height;
    }

    get load() {
        return this._load;
    }

    get resources() {
        return this._resources;
    }

    get timeout() {
        return this._timeout;
    }

    get audio() {
        return this._audio;
    }

    get quality() {
        return this._quality;
    }

    set quality(val) {
        this._quality = val;
        this._renderer._quality = this._quality;
        this._renderer._canvas.remove();
        this._renderer._initCanvas();
        for(let scene of this._sceneManager.scenes) {
            scene._buffer = null;
        }
    }

    /*
    createScene(name, zIndex, options) {
        const scene = new Scene(options);
        scene._game = this;
        this._sceneManager.add(scene, name, zIndex);
        return scene;
    }
    */

    get(n) {
        const scene = this._sceneManager.get(n);
        if(!scene) {
            return null;
        }
        return scene;
    }

    requestFullScreen() {
        try {
            const elem = this._parentElement;
            let requestMethod = (elem.requestFullScreen || elem.webkitRequestFullScreen || elem.mozRequestFullScreen);
            if(requestMethod) {
                requestMethod.call(elem);
            }
        } catch(e) {
            console.log(e);
        }
    }

    _initEventListeners() {
        const isTouchDevice = "ontouchstart" in document;
        const con = this._renderer._container;

        if(isTouchDevice) {

            con.addEventListener("touchstart", (e) => this._handleTouchEvent(e));
            con.addEventListener("touchmove", (e) => this._handleTouchEvent(e));
            con.addEventListener("touchend", (e) => this._handleTouchEvent(e));

        } else {

            con.addEventListener("mousedown", (e) => this._handleMouseEvent(e));
            con.addEventListener("mousemove", (e) => this._handleMouseEvent(e));
            con.addEventListener("mouseup", (e) => this._handleMouseEvent(e));

        }

        addEventListener("keydown", (e) => this._handleKeyEvent(e));
        addEventListener("keyup", (e) => this._handleKeyEvent(e));
    }

    _handleKeyEvent(e) {
        e.preventDefault();
        this._handleSceneEvent(e.type, {
            key: e.key
        });
    }
    _handleTouchEvent(e) {
        e.preventDefault();
        const touchToMouseType = {
            "touchstart": "mousedown",
            "touchmove": "mousemove",
            "touchend": "mouseup"
        };
        for(let i = 0; i < e.changedTouches.length; ++i) {
            this._handleSceneEvent(touchToMouseType[e.type], {
                x: e.changedTouches[i].pageX, y: e.changedTouches[i].pageY, id: e.changedTouches[i].identifier
            });
        }
    }
    _handleMouseEvent(e) {
        e.preventDefault();
        this._handleSceneEvent(e.type, {
            x: e.pageX, y: e.pageY, id: 0
        });
    }
    _handleSceneEvent(type, params) {
        for(let scene of this._sceneManager.scenes) {

            let paramsCopy = Object.assign({}, params);

            if(type.startsWith("mouse")) {
                const coords = this._renderer.displayToSceneCoords(scene, paramsCopy.x, paramsCopy.y);
                paramsCopy.x = coords.x;
                paramsCopy.y = coords.y;
            }
            
            if(scene.handleEvent(type, paramsCopy, this._renderer)) {
               break;
            }

        }
    }

    _initControls() {
        const controls = paramParser.parseObject(this._config.controls, {
            active: false,
            left: 1,
            right: 1,
            sideButtons: true,
            actionButtons: true,
            joystickRange: {min: 0, max: 100},
            theme: "dark",
            layout: {
                DPad: { left: "ArrowLeft", right: "ArrowRight", up: "ArrowUp", down: "ArrowDown" },
                X_Button: "e",
                Y_Button: "d",
                A_Button: "s",
                B_Button: "f",
                L_Button: "Control",
                R_Button: "Control",
                START_Button: " ",
                SELECT_Button: "Tab"
            }
        });

        if(!controls.active || !("ontouchstart" in document)) {
            return;
        }
        let color, color2;
        switch(controls.theme) {
            case "light":
                color = "black";
                color2 = "white";
                break;
            default:
                color = "white";
                color2 = "black";
        }
        

        const layout = controls.layout;

        const applyStyle = (elem, bg = true) => {
            elem.style.pointerEvents = "auto";
            elem.style.position = "absolute";
            elem.style.border = "2px solid " + color;
            elem.style.color = color;
            elem.style.fontFamily = "Arial";
            elem.style.display = "flex";
            elem.style.alignItems = "center";
            elem.style.justifyContent = "center";
            if(bg) {
                elem.style.background = color2;
            }
        }

        const createButton = (right, bottom, text) => {
            const button = document.createElement("div");
            button.classList.add("l_button", "l_element");
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
            button.classList.add("l_side-button", "l_element");
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
            button.classList.add("l_action-button", "l_element");
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
        controlsContainer.style.position = "fixed";
        controlsContainer.style.pointerEvents = "none";

        const controlsMap = {};

        const dpad = document.createElement("div");
        dpad.classList.add("l_dpad", "l_element");
        dpad.style.width = "120px";
        dpad.style.height = "120px";
        dpad.style.left = "15px";
        dpad.style.bottom = "50px";
        dpad.style.borderRadius = "50%";
        dpad.style.overflow = "hidden";
        applyStyle(dpad);
        controlsContainer.appendChild(dpad);

        for(let i = 0; i < 4; ++i) {
            const box = document.createElement("div");
            box.style.width = "120px";
            box.style.height = "120px";
            box.style.left = (-75 + 150 * (i % 2)) + "px";
            box.style.top = (-75 + 150 * Math.floor(i / 2)) + "px";
            applyStyle(box, false);
            dpad.appendChild(box);
        }

        const joystick = document.createElement("div");
        joystick.classList.add("l_joystick", "l_element");
        joystick.style.width = "120px";
        joystick.style.height = "120px";
        joystick.style.right = "15px";
        joystick.style.bottom = "50px";
        joystick.style.borderRadius = "50%";
        applyStyle(joystick);
        controlsContainer.appendChild(joystick);

        let joystickId = -1, dpadId = -1;

        const joystickPad = document.createElement("div");
        joystickPad.style.width = "60px";
        joystickPad.style.height = "60px";
        joystickPad.style.left = "0";
        joystickPad.style.top = "0";
        joystickPad.style.borderRadius = "50%";
        applyStyle(joystickPad);
        joystick.appendChild(joystickPad);
        joystickPad.style.display = "none";

        const handleJoystick = (type, x, y) => {
            const boundingRect = joystick.getBoundingClientRect();
            x = x - (boundingRect.x + boundingRect.width / 2);
            y = y - (boundingRect.y + boundingRect.height / 2);
            const v = new Vector(x, y);
            const d = v.mag();
            if(d > 60) {
                v.unit().mult(60);
            }
            const v1 = v.clone().unit().mult(math.lerp(math.sat(d / 60), controls.joystickRange.min, controls.joystickRange.max));
            joystickPad.style.left = (v.x + boundingRect.width / 4) + "px";
            joystickPad.style.top = (v.y + boundingRect.height / 4) + "px";
            const con = this._renderer._container.getBoundingClientRect();
            this._handleSceneEvent(type, {x: v1.x + con.x + con.width/2, y: v1.y + con.y + con.height/2, id: -1});
        };

        joystick.addEventListener("touchstart", (e) => {
            e.preventDefault();
            handleJoystick("mousedown", e.changedTouches[0].pageX, e.changedTouches[0].pageY);
            joystickId = e.changedTouches[0].identifier;
            joystickPad.style.display = "block";
        });
        joystick.addEventListener("touchmove", (e) => {
            e.preventDefault();
            for(let i = 0; i < e.changedTouches.length; ++i) {
                if(e.changedTouches[i].identifier == joystickId) {
                    handleJoystick("mousemove", e.changedTouches[i].pageX, e.changedTouches[i].pageY);
                    break;
                }
            }
            
        });
        joystick.addEventListener("touchend", (e) => {
            e.preventDefault();
            for(let i = 0; i < e.changedTouches.length; ++i) {
                if(e.changedTouches[i].identifier == joystickId) {
                    handleJoystick("mouseup", e.changedTouches[i].pageX, e.changedTouches[i].pageY);
                    joystickId = -1;
                    joystickPad.style.display = "none";
                    break;
                }
            }
        });

        controlsMap.DPad = dpad;
        controlsMap.A_Button = createButton(10, 63, "A");
        controlsMap.B_Button = createButton(63, 10, "B");
        controlsMap.X_Button = createButton(63, 116, "X");
        controlsMap.Y_Button = createButton(116, 63, "Y");

        controlsMap.L_Button = createSideButton("left");
        controlsMap.R_Button = createSideButton("right");

        controlsMap.SELECT_Button = createActionButton("Select", -20);
        controlsMap.START_Button = createActionButton("Start", 20);

        this._parentElement.appendChild(controlsContainer);

        const directions = {
            left: { v: new Vector(-1, 0), n: "left" },
            right: { v: new Vector(1, 0), n: "right" },
            up: { v: new Vector(0, -1), n: "up" },
            down: { v: new Vector(0, 1), n: "down" },
        };

        const getDPadDirection = (x, y) => {
            
            const boundingRect = dpad.getBoundingClientRect();
            x = x - (boundingRect.x + boundingRect.width / 2);
            y = y - (boundingRect.y + boundingRect.height / 2);
            const pos = new Vector(x, y);
            if(pos.mag() < 20) return [];
            const n = pos.clone().unit();
            const res = [];
            if(Vector.dot(n, directions.left.v) >= 0.5) {
                res.push(directions.left.n);
            }
            if(Vector.dot(n, directions.right.v) >= 0.5) {
                res.push(directions.right.n);
            }
            if(Vector.dot(n, directions.up.v) >= 0.5) {
                res.push(directions.up.n);
            }
            if(Vector.dot(n, directions.down.v) >= 0.5) {
                res.push(directions.down.n);
            }
            return res;
        }

        const handleDPad = (ev, dirs, keys) => {
            for(let dir of dirs) {
                this._handleSceneEvent(ev, {
                    key: keys[dir]
                });
            }
        };

        for(let attr in controlsMap) {
            const elem = controlsMap[attr];
            const key = layout[attr];

            if(attr == "DPad") {
                elem.addEventListener("touchstart", (e) => {
                    e.preventDefault();
                    const dirs = getDPadDirection(e.changedTouches[0].pageX, e.changedTouches[0].pageY);
                    dpadId = e.changedTouches[0].identifier;
                    handleDPad("keydown", dirs, key);
                });
                elem.addEventListener("touchmove", (e) => {
                    e.preventDefault();
                    for(let i = 0; i < e.changedTouches.length; ++i) {
                        if(e.changedTouches[i].identifier == dpadId) {
                            handleDPad("keyup", ["left", "right", "up", "down"], key);
                            const dirs = getDPadDirection(e.changedTouches[i].pageX, e.changedTouches[i].pageY);
                            handleDPad("keydown", dirs, key);
                        }
                    }
                });
                elem.addEventListener("touchend", (e) => {
                    e.preventDefault();
                    for(let i = 0; i < e.changedTouches.length; ++i) {
                        if(e.changedTouches[i].identifier == dpadId) {
                            dpadId = -1;
                            handleDPad("keyup", ["left", "right", "up", "down"], key);
                        }
                    }
                    
                });
                continue;
            }
            elem.addEventListener("touchstart", (e) => {
                e.preventDefault();
                this._handleSceneEvent("keydown", {
                    key: key
                });
            });
            elem.addEventListener("touchmove", (e) => {
                e.preventDefault();
                this._handleSceneEvent("keydown", {
                    key: key
                });
            });
            elem.addEventListener("touchend", (e) => {
                e.preventDefault();
                this._handleSceneEvent("keyup", {
                    key: key
                });
            });
        }

        switch(controls.left) {
            case 0:
                dpad.style.display = "none";
                break;
        }

        if(controls.left == 0) {
            dpad.style.display = "none";
        }

        if(controls.right == 2 || controls.right == 0) {
            controlsMap.X_Button.style.display = "none";
            controlsMap.Y_Button.style.display = "none";
            controlsMap.A_Button.style.display = "none";
            controlsMap.B_Button.style.display = "none";
        }

        if(controls.right == 1 || controls.right == 0) {
            joystick.style.display = "none";
        }

        if(!controls.sideButtons) {
            controlsMap.L_Button.style.display = "none";
            controlsMap.R_Button.style.display = "none";
        }

        if(!controls.actionButtons) {
            controlsMap.START_Button.style.display = "none";
            controlsMap.SELECT_Button.style.display = "none";
        }
    }
}