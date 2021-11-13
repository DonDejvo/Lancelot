import { Game } from "./core/game.js";
import { Component } from "./core/component.js";
import { Drawable, FixedDrawable } from "./core/drawable/drawable.js";
import { Circle } from "./core/drawable/circle.js";
import { Line } from "./core/drawable/line.js";
import { Polygon, Poly } from "./core/drawable/polygon.js";
import { Rect } from "./core/drawable/rect.js";
import { Sprite } from "./core/drawable/sprite.js";
import { Image } from "./core/drawable/image.js";
import { Text } from "./core/drawable/text.js";
import { Path } from "./core/drawable/path.js";
import { Vector } from "./core/utils/vector.js";
import * as physics from "./core/physics/physics.js";
import * as particles from "./core/particles/emitter.js";
import { math } from "./core/utils/math.js";
import * as light from "./core/light/light.js";
import { Tileset } from "./core/tileset.js";
import { PathGraph } from "./core/path-graph.js";

const __name = 'Lancelot';

const drawable = {
    Drawable, FixedDrawable,
    Circle,
    Line,
    Polygon, Poly,
    Rect,
    Sprite,
    Text,
    Path,
    Image
};

let __export = {
    Vector,
    Game,
    Component,
    Tileset,
    particles,
    drawable,
    physics,
    math,
    light,
    PathGraph
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