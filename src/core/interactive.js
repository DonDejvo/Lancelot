import { Component } from "./component.js";
import { ParamParser } from "./utils/param-parser.js";

export class Interactive extends Component {
    constructor(params) {
        super();
        this._type = "interactive";
        this._capture = ParamParser.ParseValue(params.capture, true);
        this._eventHandlers = new Map();
    }
    On(type, handler) {
        if(!this._eventHandlers.has(type)) {
            this._eventHandlers.set(type, []);
        }
        const handlers = this._eventHandlers.get(type);
        handlers.push(handler);
    }
    Off(type, handler) {
        if(!this._eventHandlers.has(type)) { return; }
        const handlers = this._eventHandlers.get(type);
        const idx = handlers.indexOf(handler);
        if(idx > -1) {
            handlers.splice(idx, 1);
        }

    }
    _On(type, event) {
        if(!this._eventHandlers.has(type)) { return; }
        const handlers = this._eventHandlers.get(type);
        for(let handler of handlers) {
            handler(event);
        }
    }
}