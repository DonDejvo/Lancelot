export class SceneManager {
    constructor() {
        this._scenes = [];
        this._scenesMap = new Map();
    }
    Add(s, n, p = 0) {
        s._priority = p;
        this._scenesMap.set(n, s);
        let idx = this._scenes.indexOf(s);
        if(idx != -1) {
            this._scenes.splice(idx, i);
        }
        this._scenes.push(s);
        for(let i = this._scenes.length - 1; i > 0; --i) {
            if(this._scenes[i]._priority > this._scenes[i - 1]._priority) {
                break;
            }
            [this._scenes[i], this._scenes[i - 1]] = [this._scenes[i - 1], this._scenes[i]];
        }
        return s;
    }
    Get(n) {
        return (this._scenesMap.get(n) || null);
    }
    Play(n) {
        const s = this._scenesMap.get(n);
        if(!s) {
            return null;
        }
        s.paused = false;
        return s;
    }
}