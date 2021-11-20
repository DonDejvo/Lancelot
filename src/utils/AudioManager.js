import { math } from "./Math.js";
import { paramParser } from "./ParamParser.js";

export class AudioManager {
    
    _resources;
    _bgmusic;
    _effects;

    constructor(resources) {
        this._resources = resources;
        this._effects = new Effects(this._resources);
        this._bgmusic = new BgMusic(this._resources);
    }

    get bgmusic() {
        return this._bgmusic;
    }

    get effects() {
        return this._effects;
    }

}

class BgMusic {

    _resources;
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
        const volume = math.sat(val);
        this._volume = volume;
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
        return this._audio ? this._audio.paused : true;
    }

    set(name) {
        this._audio = this._resources.get(name).cloneNode(true);
        this._set();
    }

    play() {
        if(this._audio) {
            this._audio.play();
        }
    }

    pause() {
        if(this._audio) {
            this._audio.pause();
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
        const volume = math.sat(val);
        this._volume = val;
        for(let audio of this._arr) {
            audio.volume = this._volume;
        }
    }

    play(name, params) {
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
        audioElem.play();
    }

}