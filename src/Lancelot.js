import { Game } from "./core/Game.js";
import { Scene } from "./core/Scene.js";
import { Component } from "./core/Component.js";
import * as utils from "./utils/_index.js";
import * as drawable from "./drawable/_index.js";
import * as physics from "./physics/_index.js";

const start = (config) => {
    addEventListener("DOMContentLoaded", () => new Game(config));
}

const __name = 'Lancelot';

let __export = {
    start,
    Scene,
    Component,
    utils,
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