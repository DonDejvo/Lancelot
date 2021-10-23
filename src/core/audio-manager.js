import { math } from "./utils/math.js";

export class AudioSection {
    constructor() {
        this._volume = 1.0;
        this._playing = false;
        this._audioMap = new Map();
        this._current = null;
        this._secondary = [];
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
        for(let audio of this._secondary) {
            audio.volume = this._volume;
        }
    }
    get playing() {
        return this._current ? !this._current.paused : false;
    }
    AddAudio(n, audio) {
        audio.volume = this._volume;
        this._audioMap.set(n, audio);
    }
    Play(n, params) {
        if(this._current) {
            this._current.pause();
        }
        const audio = this._audioMap.get(n);
        if(audio) {
            if (params.primary === undefined || params.primary == true) {
                this._current = audio;
                if (params.time !== undefined) {
                    this._current.currentTime = math.sat(params.time) * this._current.duration;
                }
                this._current.loop = (params.loop || false);
                this._current.play();
            } else {
                this.PlaySecondary(n);
            }
        }
    }
    PlaySecondary(n) {
        const audio = this._audioMap.get(n);
        if(audio) {
            const audioClone = audio.cloneNode(true);
            this._secondary.push(audioClone);
            audioClone.addEventListener("ended", () => {
                let idx = this._secondary.indexOf(audioClone);
                if(idx != -1) {
                    this._secondary.splice(idx, 1);
                }
            })
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