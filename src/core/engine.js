import { FPSMeter } from "../utils/FPSMeter.js";

export class Engine {

    _paused = true;
    _step;
    _fpsMeter = new FPSMeter();
    _minFps = 20;

    constructor(step) {

        this._step = step;
    }

    get paused() {
        return this._paused;
    }

    _RAF() {

        this._frame = window.requestAnimationFrame((timestamp) => {
            if(!this._paused) {
                this._RAF();
            }

            const elapsedTime = timestamp - this._previousRAF;

            this._fpsMeter.update(elapsedTime * 0.001);

            this._step(Math.min(elapsedTime, 1000 / this._minFps));
            this._previousRAF = timestamp;
        });
    }

    start() {
        this._paused = false;
        this._previousRAF = performance.now();
        this._RAF();
    }

    stop() {
        this._paused = true;
        window.cancelAnimationFrame(this._frame);
    }

}