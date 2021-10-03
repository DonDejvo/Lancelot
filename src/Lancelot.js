import { Game } from "./core/game.js";
import { Component } from "./core/component.js";
import * as drawable from "./core/drawable/drawable.js";
import { Vector } from "./core/utils/vector.js";
import * as physics from "./core/physics/physics.js";

const __name = 'Lancelot';

let __export = {
    Vector,
    Game,
    Component,
    drawable,
    physics
};

if (typeof module === 'object' && typeof module.exports === 'object') {
    module.exports = __export;
} else if (typeof define === 'function' && define.amd) {
    define(__name, [], __export);
} else {
    let global = typeof globalThis !== 'undefined' ? globalThis : self;
    global[__name] = __export;
}

export default __export;