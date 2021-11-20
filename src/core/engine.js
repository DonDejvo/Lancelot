import { TimeoutHandler } from "../utils/TimeoutHandler.js";

export class Engine {

    _paused = true;
    _step;

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
            const elapsedTime = Math.min(timestamp - this._previousRAF, 1000 / 30);

            this._step(elapsedTime);

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