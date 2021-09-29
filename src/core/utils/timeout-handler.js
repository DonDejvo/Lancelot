export class TimeoutHandler {
    constructor() {
        this._timeouts = [];
    }
    Set(f, dur) {
        this._timeouts.push({ action: f, dur: dur, counter: 0 });
    }
    Update(elapsedTime) {
        for(let i = 0; i < this._timeouts.length; ++i) {
            const timeout = this._timeouts[i];
            if((timeout.counter += elapsedTime) >= timeout.dur) {
                timeout.action();
                this._timeouts.splice(i--, 1);
            }
        }
    }
}