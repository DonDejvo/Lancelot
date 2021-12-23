import { Component } from "../core/Component.js";

export class Interactive extends Component {

    _eventHandlers = new Map();
    _id = -1;

    constructor() {
        super();
        this._type = "interactive";
    }

    on(type, handler, capture = false) {
        if(!this._eventHandlers.has(type)) {
            this._eventHandlers.set(type, []);
        }
        const handlers = this._eventHandlers.get(type);
        handlers.push({ handler: handler, capture: capture });
    }

    off(type, handler) {
        if(!this._eventHandlers.has(type)) {
            return;
        }
        const handlers = this._eventHandlers.get(type);
        const idx = handlers.findIndex((e) => e.handler == handler);
        if(idx != -1) {
            handlers.splice(idx, 1);
        }

    }

    handleEvent(type, event) {
        if(!this._eventHandlers.has(type)) {
            return false;
        }
        let captured = false;
        const handlers = this._eventHandlers.get(type);
        for(let e of handlers) {
            e.handler(event);
            if(e.capture) {
                captured = true;
            }
        }
        return captured;
    }
}