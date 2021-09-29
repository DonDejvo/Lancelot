import { TimeoutHandler } from "./utils/timeout-handler.js";

export class Engine {
    constructor(step) {

        this._step = step;
        this.paused = true;
        this.timeout = new TimeoutHandler();
    }
    _RAF() {

        if(this._paused) { return; }

        this._frame = window.requestAnimationFrame((timestamp) => {
            this._RAF();
            const elapsedTime = Math.min(timestamp - this._previousRAF, 1000 / 30);

            this.timeout.Update(elapsedTime);
            this._step(elapsedTime);

            this._previousRAF = timestamp;
        });
    }
    Start() {
        this.paused = false;
        this._previousRAF = performance.now();
        this._RAF();
    }
    Stop() {
        this.paused = true;
        window.cancelAnimationFrame(this._frame);
    }
}