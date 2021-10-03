import { math } from "./utils/math.js";

export class AudioSection {
    constructor() {
        this._volume = 1.0;
        this._playing = false;
        this._audioMap = new Map();
        this._current = null;
    }
    get volume() {
        return this._volume;
    }
    set volume(num) {
        num = math.sat(num);
        this._volume = num;
        this._audioMap.forEach((audio) => {
            audio.volume = this._volume;
        });
    }
    get playing() {
        return this._current ? !this._current.paused : false;
    }
    AddAudio(n, audio, loop = false) {
        audio.loop = loop;
        audio.volume = this._volume;
        this._audioMap.set(n, audio);
    }
    Play(n, fromStart = false) {
        if(this._current) {
            this._current.pause();
        }
        const audio = this._audioMap.get(n);
        if(audio) {
            this._current = audio;
            if(fromStart) {
                this._current.currentTime = 0;
            }
            this._current.play();
        }
    }
    PlayClone(n) {
        const audio = this._audioMap.get(n);
        if(audio) {
            const audioClone = audio.cloneNode(true);
            audioClone.volume = this._volume;
            audioClone.play();
        }
    }
    Pause() {
        if(this._current) {
            this._current.pause();
        }
    }
}