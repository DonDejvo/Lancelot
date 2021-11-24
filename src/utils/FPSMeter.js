export class FPSMeter {
    
    _fps = 60;
    _frameCounter = 0;
    _timeCounter = 0;

    get fps() {
        return this._fps;
    }

    update(elapsedTimeS) {
        this._timeCounter += elapsedTimeS;
        ++this._frameCounter;
        if(this._timeCounter >= 1) {
            this._timeCounter -= 1;
            this._fps = this._frameCounter;
            this._frameCounter = 0;
        }
    }

}