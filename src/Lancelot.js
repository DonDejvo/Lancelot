import { Game } from "./core/game.js";
import { Loader } from "./core/loader.js";
import { Entity } from "./core/entity.js";
import { Component } from "./core/component.js";
import { Drawable, Text } from "./core/drawable/drawable.js";
import { Vector } from "./core/utils/vector.js";

const __name = 'Lancelot';

let drawable = {
    Drawable,
    Text
}

let __export = {
    Vector,
    Game,
    Loader,
    Entity,
    Component,
    drawable
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