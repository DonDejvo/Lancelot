import { Engine } from "./engine.js";
import { Renderer } from "./renderer.js";
import { SceneManager } from "./scene-manager.js";
import { Scene } from "./scene.js";

export class Game {
    constructor(params) {
        this._width = params.width;
        this._height = params.height;

        this._renderer = new Renderer({
            width: this._width,
            height: this._height
        });
        this._engine = new Engine();
        this._sceneManager = new SceneManager();

        this.timeout = this._engine.timeout;

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

    }
    get background() {
        return this._renderer.background;
    }
    set background(col) {
        this._renderer.background = col;
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

    }
    ShowSection(id) {

    }
    HideSection(id) {

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