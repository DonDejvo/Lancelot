import { AudioSection } from "./audio-manager.js";
import { Engine } from "./engine.js";
import { Renderer } from "./renderer.js";
import { SceneManager } from "./scene-manager.js";
import { Scene } from "./scene.js";
import { Loader } from "./loader.js";

export class Game {
    constructor(params) {
        this._width = params.width;
        this._height = params.height;
        this._preload = params.preload.bind(this);
        this._init = params.init.bind(this);

        this._resources = null;

        this._loader = new Loader();

        this._renderer = new Renderer({
            width: this._width,
            height: this._height,
            background: params.background
        });
        this._engine = new Engine();
        this._sceneManager = new SceneManager();

        this.timeout = this._engine.timeout;
        this.audio = (() => {
            const sections = new Map();
            const AddSection = (n) => {
                sections.set(n, new AudioSection());
            }
            AddSection("music");
            AddSection("effects");
            const AddAudio = (sectionName, audioName, loop = false) => {
                const section = sections.get(sectionName);
                section.AddAudio(audioName, this._resources.get(audioName), loop);
            }
            const AddMusic = (audioName, loop = false) => {
                AddAudio("music", audioName, loop);
            }
            const AddEffect = (audioName, loop = false) => {
                AddAudio("effects", audioName, loop);
            }
            return {
                get music() {
                    return sections.get("music");
                },
                get effects() {
                    return sections.get("effects");
                },
                AddMusic,
                AddEffect
            };
        })();

        const step = (elapsedTime) => {
            const scene = this._sceneManager.currentScene;
            if(scene) {
                scene.Update(elapsedTime * 0.001);
            }
            this._renderer.Render(scene);
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
    get background() {
        return this._renderer.background;
    }
    set background(col) {
        this._renderer.background = col;
    }
    get loader() {
        return this._loader;
    }
    get resources() {
        return this._resources;
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

    }
    _HandleTouchEvent(e) {

        const touchToMouseType = {
            "touchstart": "mousedown",
            "touchmove": "mousemove",
            "touchend": "mouseup"
        };

        this._HandleSceneEvent(touchToMouseType[e.type], e.changedTouches[0].pageX, e.changedTouches[0].pageY);
    }
    _HandleMouseEvent(e) {

        this._HandleSceneEvent(e.type, e.pageX, e.pageY);
    }
    _HandleSceneEvent(type, x, y) {
        const scene = this._sceneManager.currentScene;
        if(scene) {
            const coords = this._renderer.DisplayToSceneCoords(scene, x, y);
            scene._On(type, { x: coords.x, y: coords.y, id: 0, type: type });
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
        const scene = new Scene({
            bounds: (params.bounds || [[-1000, -1000], [1000, 1000]]),
            cellDimensions: params.cellDimensions
        });
        this._sceneManager.Add(scene, n);
        return scene;
    }
    PlayScene(n) {
        return this._sceneManager.Play(n);
    }
    PauseScene() {
        const scene = this._sceneManager.currentScene;
        if(scene) {
            scene.paused ? scene.Play() : scene.Pause();
        }
    }
}