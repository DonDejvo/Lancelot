export class SceneManager {
    constructor() {
        this._currentScene = null;
        this._scenes = new Map();
    }
    get currentScene() {
        return this._currentScene;
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