import { Game } from "./core/game.js";
import { Loader } from "./core/loader.js";
import { Entity } from "./core/entity.js";

const __name = 'Lancelot';

let __export = {
  Game,
  Loader,
  Entity
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