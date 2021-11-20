export class TimeoutHandler {

    _timeouts = [];

    set(f, dur) {
        const t = { action: f, dur: dur, counter: 0 };
        this._timeouts.push(t);
        return t;
    }
    clear(t) {
        let idx = this._timeouts.indexOf(t);
        if(idx != -1) {
            this._timeouts.splice(idx, 1);
        }
    }
    update(elapsedTime) {
        for(let i = 0; i < this._timeouts.length; ++i) {
            const timeout = this._timeouts[i];
            if((timeout.counter += elapsedTime) >= timeout.dur) {
                timeout.action();
                this._timeouts.splice(i--, 1);
            }
        }
    }
}