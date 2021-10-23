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
        this._preload = params.preload == undefined ? null : params.preload.bind(this);
        this._init = params.init.bind(this);

        this._resources = null;

        this._loader = new Loader();

        this._renderer = new Renderer({
            width: this._width,
            height: this._height
        });
        this._engine = new Engine();
        this._sceneManager = new SceneManager();

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
                this._renderer.Render(scene);
            }
            
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
        for(let i = this._sceneManager._scenes.length - 1; i >= 0; --i) {

            const params = Object.assign({}, params0);
            
            const scene = this._sceneManager._scenes[i];
            
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
        this._sceneManager.Add(scene, n, (params.priority || 0));
        return scene;
    }
    PlayScene(n) {
        return this._sceneManager.Play(n);
    }
}