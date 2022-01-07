import { math } from "./Math.js";
import { paramParser } from "./ParamParser.js";

export class AudioManager {
    
    _resources;
    _bgmusic;
    _effects;

    constructor(resources) {
        this._resources = resources;
        this._effects = new Effects(this._resources);
        this._music = new Music(this._resources);
    }

    get music() {
        return this._music;
    }

    get effects() {
        return this._effects;
    }

}

class Music {

    _resources;
    _paused = true;
    _audio = null;
    _volume = 1.0;
    _speed = 1.0;
    _loop = false;

    constructor(resources) {
        this._resources = resources;
    }

    get volume() {
        return this._volume;
    }

    set volume(val) {
        this._volume = math.sat(val);
        this._set();
    }

    get speed() {
        return this._speed;
    }

    set speed(val) {
        if(val > 0) {
            this._speed = val;
            this._set();
        }
    }

    get loop() {
        return this._loop;
    }

    set loop(val) {
        this._loop = val;
        this._set();
    }

    get time() {
        return this._audio ? this._audio.currentTime : 0;
    }

    set time(val) {
        if(this._audio) {
            this._audio.currentTime = math.clamp(val, 0, this._audio.duration);
        }
    }

    get paused() {
        return this._paused;
    }

    set(name) {
        if(!this._paused) {
            this._audio.pause();
        }
        this._audio = this._resources.get(name).cloneNode(true);
        this._set();
        if(!this._paused) {
            this.play();
        }
    }

    play() {
        this._paused = false;
        if(this._audio) {
            const promise = this._audio.play();
        if(promise) {
            promise.then(_ => {}).catch((err) => console.log("fuck"));
        }
        }
    }

    pause() {
        this._paused = true;
        if(this._audio) {
            try {
                this._audio.pause();
            } catch(e) {
                console.log(e);
            }
        }
    }

    _set() {
        if(this._audio) {
            this._audio.volume = this._volume;
            this._audio.playbackRate = this._speed;
            this._audio.loop = this._loop;
        }
    }
}

class Effects {

    _resources;
    _volume = 1.0;
    _arr = [];

    constructor(resources) {
        this._resources = resources;
    }

    get volume() {
        return this._volume;
    }

    set volume(val) {
        this._volume = math.sat(val);
        for(let audio of this._arr) {
            audio.volume = this._volume;
        }
    }

    play(name, params = {}) {
        const speed = paramParser.parseValue(params.speed, 1.0);
        const audioElem = this._resources.get(name).cloneNode(true);
        audioElem.addEventListener("ended", () => {
            const idx = this._arr.indexOf(audioElem);
            if(idx != -1) {
                this._arr.splice(idx, 1);
            }
        });
        audioElem.volume = this._volume;
        audioElem.playbackRate = speed;
        this._arr.push(audioElem);
        const promise = audioElem.play();
        if(promise) {
            promise.then(_ => {}).catch((err) => console.log("fuck"));
        }
    }

}