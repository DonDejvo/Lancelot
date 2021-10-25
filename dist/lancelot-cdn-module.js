var __defProp = Object.defineProperty;
var __markAsModule = (target) => __defProp(target, "__esModule", { value: true });
var __export = (target, all) => {
  __markAsModule(target);
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// src/core/utils/math.js
var math = function() {
  return {
    rand(min, max) {
      return Math.random() * (max - min) + min;
    },
    randint(min, max) {
      return Math.floor(Math.random() * (max - min + 1) + min);
    },
    lerp(x, a, b) {
      return a + (b - a) * x;
    },
    clamp(x, a, b) {
      return Math.min(Math.max(x, a), b);
    },
    in_range(x, a, b) {
      return x >= a && x <= b;
    },
    sat(x) {
      return Math.min(Math.max(x, 0), 1);
    },
    ease_out(x) {
      return Math.min(Math.max(Math.pow(x, 1 / 2), 0), 1);
    },
    ease_in(x) {
      return Math.min(Math.max(Math.pow(x, 3), 0), 1);
    },
    choice(arr) {
      const len = arr.length;
      return arr[Math.floor(Math.random() * len)];
    }
  };
}();

// src/core/audio-manager.js
var AudioSection = class {
  constructor() {
    this._volume = 1;
    this._playing = false;
    this._audioMap = new Map();
    this._current = null;
    this._secondary = [];
  }
  get volume() {
    return this._volume;
  }
  set volume(num) {
    num = math.sat(num);
    this._volume = num;
    this._audioMap.forEach((audio) => {
      audio.volume = this._volume;
    });
    for (let audio of this._secondary) {
      audio.volume = this._volume;
    }
  }
  get playing() {
    return this._current ? !this._current.paused : false;
  }
  AddAudio(n, audio) {
    audio.volume = this._volume;
    this._audioMap.set(n, audio);
  }
  Play(n, params) {
    if (this._current) {
      this._current.pause();
    }
    const audio = this._audioMap.get(n);
    if (audio) {
      if (params.primary === void 0 || params.primary == true) {
        this._current = audio;
        if (params.time !== void 0) {
          this._current.currentTime = math.sat(params.time) * this._current.duration;
        }
        this._current.loop = params.loop || false;
        this._current.play();
      } else {
        this.PlaySecondary(n);
      }
    }
  }
  PlaySecondary(n) {
    const audio = this._audioMap.get(n);
    if (audio) {
      const audioClone = audio.cloneNode(true);
      this._secondary.push(audioClone);
      audioClone.addEventListener("ended", () => {
        let idx = this._secondary.indexOf(audioClone);
        if (idx != -1) {
          this._secondary.splice(idx, 1);
        }
      });
      audioClone.volume = this._volume;
      audioClone.play();
    }
  }
  Pause() {
    if (this._current) {
      this._current.pause();
    }
  }
};

// src/core/utils/timeout-handler.js
var TimeoutHandler = class {
  constructor() {
    this._timeouts = [];
  }
  Set(f, dur) {
    const t = { action: f, dur, counter: 0 };
    this._timeouts.push(t);
    return t;
  }
  Clear(t) {
    let idx = this._timeouts.indexOf(t);
    if (idx != -1) {
      this._timeouts.splice(idx, 1);
    }
  }
  Update(elapsedTime) {
    for (let i2 = 0; i2 < this._timeouts.length; ++i2) {
      const timeout = this._timeouts[i2];
      if ((timeout.counter += elapsedTime) >= timeout.dur) {
        timeout.action();
        this._timeouts.splice(i2--, 1);
      }
    }
  }
};

// src/core/engine.js
var Engine = class {
  constructor(step) {
    this._step = step;
    this.paused = true;
    this.timeout = new TimeoutHandler();
  }
  _RAF() {
    if (this._paused) {
      return;
    }
    this._frame = window.requestAnimationFrame((timestamp) => {
      this._RAF();
      const elapsedTime = Math.min(timestamp - this._previousRAF, 1e3 / 30);
      this.timeout.Update(elapsedTime);
      this._step(elapsedTime);
      this._previousRAF = timestamp;
    });
  }
  Start() {
    this.paused = false;
    this._previousRAF = performance.now();
    this._RAF();
  }
  Stop() {
    this.paused = true;
    window.cancelAnimationFrame(this._frame);
  }
};

// src/core/utils/style-parser.js
var StyleParser = function() {
  return {
    ParseColor(ctx, s) {
      if (s == void 0) {
        return "black";
      }
      const params = s.split(";");
      const len = params.length;
      if (len === 1) {
        return s;
      }
      let grd;
      const values = params[1].split(",").map((s2) => parseFloat(s2));
      switch (params[0]) {
        case "linear-gradient":
          grd = ctx.createLinearGradient(...values);
          break;
        case "radial-gradient":
          grd = ctx.createRadialGradient(...values);
          break;
        default:
          return "black";
      }
      for (let i2 = 2; i2 < len; ++i2) {
        const colorValuePair = params[i2].split("=");
        grd.addColorStop(parseFloat(colorValuePair[1]), colorValuePair[0]);
      }
      return grd;
    }
  };
}();

// src/core/utils/vector.js
var Vector = class {
  constructor(x = 0, y = 0) {
    this._x = x;
    this._y = y;
  }
  get x() {
    return this._x;
  }
  get y() {
    return this._y;
  }
  set x(num) {
    this.Set(num, this.y);
  }
  set y(num) {
    this.Set(this.x, num);
  }
  Set(x, y) {
    this._x = x;
    this._y = y;
  }
  Copy(v1) {
    this.Set(v1.x, v1.y);
    return this;
  }
  Clone() {
    return new Vector(this.x, this.y);
  }
  Add(v1) {
    this.Set(this.x + v1.x, this.y + v1.y);
    return this;
  }
  Sub(v1) {
    this.Set(this.x - v1.x, this.y - v1.y);
    return this;
  }
  Mult(s) {
    this.Set(this.x * s, this.y * s);
    return this;
  }
  Norm() {
    this.Set(this.y, -this.x);
    return this;
  }
  Unit() {
    const z = this.Mag();
    if (z === 0) {
      return this;
    }
    this.Set(this.x / z, this.y / z);
    return this;
  }
  Mag() {
    return Math.sqrt(Math.pow(this.x, 2) + Math.pow(this.y, 2));
  }
  Lerp(v1, alpha) {
    return this.Add(v1.Clone().Sub(this).Mult(alpha));
  }
  Angle() {
    return Math.atan2(this.y, this.x);
  }
  Rotate(angle) {
    const sin = Math.sin(angle);
    const cos = Math.cos(angle);
    const x = this.x * cos - this.y * sin;
    const y = this.x * sin + this.y * cos;
    this.Set(x, y);
    return this;
  }
  static FromAngle(angle) {
    return new Vector(1, 0).Rotate(angle);
  }
  static Dot(v1, v2) {
    return v1.x * v2.x + v1.y * v2.y;
  }
  static Dist(v1, v2) {
    return v1.Clone().Sub(v2).Mag();
  }
  static Cross(v1, v2) {
    return v1.x * v2.y - v1.y * v2.x;
  }
  static AngleBetween(v1, v2) {
    const z1 = v1.Mag();
    const z2 = v2.Mag();
    if (z1 === 0 || z2 === 0) {
      return 0;
    }
    return Math.acos(Vector.Dot(v1, v2) / (z1 * z2));
  }
};
var PositionVector = class extends Vector {
  constructor(positionFunction, x = 0, y = 0) {
    super(x, y);
    this._positionFunction = positionFunction;
  }
  Set(x, y) {
    if (x != this.x || y != this.y) {
      this._x = x;
      this._y = y;
      this._positionFunction();
    }
  }
};

// src/core/renderer.js
var Renderer = class {
  constructor(params) {
    this._width = params.width;
    this._height = params.height;
    this._aspect = this._width / this._height;
    this._scale = 1;
    this._InitContainer();
    this._InitCanvas();
    this._OnResize();
    window.addEventListener("resize", () => this._OnResize());
  }
  get dimension() {
    return this._canvas.getBoundingClientRect();
  }
  get background() {
    return this._background;
  }
  set background(col) {
    this._background = col;
    this._canvas.style.background = col;
  }
  _InitContainer() {
    const con = this._container = document.createElement("div");
    con.style.width = this._width + "px";
    con.style.height = this._height + "px";
    con.style.position = "absolute";
    con.style.left = "50%";
    con.style.top = "0%";
    con.style.transformOrigin = "center";
    document.body.appendChild(con);
  }
  _InitCanvas() {
    const cnv = this._canvas = document.createElement("canvas");
    cnv.width = this._width;
    cnv.height = this._height;
    this._context = cnv.getContext("2d");
    cnv.style.position = "absolute";
    cnv.style.left = "0";
    cnv.style.top = "0";
    cnv.style.display = "block";
    cnv.style.background = this._background;
    this._container.appendChild(cnv);
  }
  _OnResize() {
    const [width, height] = [document.body.clientWidth, document.body.clientHeight];
    if (width / height > this._aspect) {
      this._scale = height / this._height;
    } else {
      this._scale = width / this._width;
    }
    this._container.style.transform = "translate(-50%, calc(-50% + " + this._height / 2 * this._scale + "px)) scale(" + this._scale + ")";
    this._context.imageSmoothingEnabled = false;
  }
  Render() {
    const ctx = this._context;
    ctx.beginPath();
    ctx.clearRect(0, 0, this._width, this._height);
  }
  DisplayToSceneCoords(scene, x, y) {
    const boundingRect = this.dimension;
    const scaledX = (x - boundingRect.left) / this._scale;
    const scaledY = (y - boundingRect.top) / this._scale;
    const cam = scene.camera;
    return {
      x: (scaledX - this._width / 2) / cam.scale + cam.position.x,
      y: (scaledY - this._height / 2) / cam.scale + cam.position.y
    };
  }
};

// src/core/scene-manager.js
var SceneManager = class {
  constructor() {
    this._scenes = [];
    this._scenesMap = new Map();
  }
  Add(s, n, p = 0) {
    s._zIndex = p;
    this._scenesMap.set(n, s);
    let idx = this._scenes.indexOf(s);
    if (idx != -1) {
      this._scenes.splice(idx, i);
    }
    this._scenes.push(s);
    for (let i2 = this._scenes.length - 1; i2 > 0; --i2) {
      if (this._scenes[i2]._zIndex <= this._scenes[i2 - 1]._zIndex) {
        break;
      }
      [this._scenes[i2], this._scenes[i2 - 1]] = [this._scenes[i2 - 1], this._scenes[i2]];
    }
    return s;
  }
  Get(n) {
    return this._scenesMap.get(n) || null;
  }
  Play(n) {
    const s = this._scenesMap.get(n);
    if (!s) {
      return null;
    }
    s.paused = false;
    return s;
  }
};

// src/core/entity-manager.js
var EntityManager = class {
  constructor() {
    this._entities = [];
    this._entitiesMap = new Map();
    this._ids = 0;
  }
  _GenerateName() {
    ++this._ids;
    return "__entity__" + this._ids;
  }
  Add(e, n) {
    if (n === void 0) {
      n = this._GenerateName();
    }
    this._entities.push(e);
    this._entitiesMap.set(n, e);
    e._parent = this;
    e._name = n;
  }
  Get(n) {
    return this._entitiesMap.get(n);
  }
  Remove(e) {
    const i2 = this._entities.indexOf(e);
    if (i2 < 0) {
      return;
    }
    this._entities.splice(i2, 1);
  }
  Filter(cb) {
    return this._entities.filter(cb);
  }
  Update(elapsedTimeS) {
    for (let e of this._entities) {
      e.Update(elapsedTimeS);
    }
  }
};

// src/core/utils/position.js
var Position = class {
  constructor() {
    this._pos = new PositionVector(this.DoWeirdStuff.bind(this));
    this._parent = null;
    this._fixed = false;
    this._offset = new PositionVector(this.DoWeirdStuffWithOffset.bind(this));
    ;
    this._attached = [];
    this._moving = null;
  }
  Clip(p, fixed = false) {
    this._attached.push(p);
    p._parent = this;
    p._fixed = fixed;
    p._offset.Copy(p.position.Clone().Sub(this.position));
  }
  Unclip(e) {
    const i2 = this._attached.indexOf(e);
    if (i2 != -1) {
      this._attached.splice(i2, 1);
      e._parent = null;
    }
  }
  get position() {
    return this._pos;
  }
  set position(p) {
    this.position.Copy(p);
  }
  MoveTo(p, dur, timing = "linear") {
    this._moving = {
      counter: 0,
      dur,
      from: this.position.Clone(),
      to: p,
      timing
    };
  }
  StopMoving() {
    this._moving = null;
  }
  DoWeirdStuff() {
    if (this._parent) {
      if (this._fixed) {
        this._parent.position.Copy(this.position.Clone().Sub(this._offset));
      } else {
        this._offset.Copy(this.position.Clone().Sub(this._parent.position));
      }
    }
    for (let p of this._attached) {
      p.position.Copy(this.position.Clone().Add(p._offset));
    }
  }
  DoWeirdStuffWithOffset() {
    if (this._parent && this._fixed) {
      this.position.Copy(this._parent.position.Clone().Add(this._offset));
    }
  }
  Update(elapsedTimeS) {
    if (this._moving) {
      const anim = this._moving;
      anim.counter += elapsedTimeS * 1e3;
      const progress = Math.min(anim.counter / anim.dur, 1);
      let value;
      switch (anim.timing) {
        case "linear":
          value = progress;
          break;
        case "ease-in":
          value = math.ease_in(progress);
          break;
        case "ease-out":
          value = math.ease_out(progress);
          break;
      }
      this.position.Copy(anim.from.Clone().Lerp(anim.to, value));
      if (progress == 1) {
        this._moving = null;
      }
    }
  }
};

// src/core/camera.js
var Camera = class {
  constructor() {
    this._position = new Position();
    this.scale = 1;
    this._target = null;
    this._vel = new Vector();
    this._scaling = null;
    this._shaking = null;
    this._offset = new Vector();
  }
  get position() {
    return this._position.position;
  }
  set position(vec) {
    this._position.position.Copy(vec);
  }
  get shaking() {
    return this._shaking;
  }
  get scaling() {
    return this._scaling;
  }
  get moving() {
    return this._position._moving;
  }
  get velocity() {
    return this._vel;
  }
  set velocity(vec) {
    this._vel.Copy(vec);
  }
  Clip(e) {
    this._position.Clip(e._position);
  }
  Unclip(e) {
    this._position.Unclip(e._position);
  }
  MoveTo(p, dur, timing = "linear") {
    this._position.MoveTo(p, dur, timing);
  }
  StopMoving() {
    this._position.StopMoving();
  }
  Follow(target) {
    this._target = target;
  }
  Unfollow() {
    this._target = null;
  }
  ScaleTo(s, dur, timing = "linear") {
    this._scaling = {
      counter: 0,
      dur,
      from: this.scale,
      to: s,
      timing
    };
  }
  StopScaling() {
    this._scaling = null;
  }
  MoveAndScale(p, s, dur, timing = "linear") {
    this.MoveTo(p, dur, timing);
    this.ScaleTo(s, dur, timing);
  }
  Shake(range, dur, count, angle) {
    this._shaking = {
      counter: 0,
      count,
      angle,
      dur,
      range
    };
  }
  StopShaking() {
    this._shaking = null;
    this._offset = new Vector();
  }
  Update(elapsedTimeS) {
    if (this.moving) {
      this._position.Update(elapsedTimeS);
    } else if (this._target) {
      const t = 4 * elapsedTimeS;
      this.position.Lerp(this._target.position, t);
    } else {
      const vel = this._vel.Clone();
      vel.Mult(elapsedTimeS);
      this.position.Add(vel);
    }
    if (this._scaling) {
      const anim = this._scaling;
      anim.counter += elapsedTimeS * 1e3;
      const progress = Math.min(anim.counter / anim.dur, 1);
      let value;
      switch (anim.timing) {
        case "linear":
          value = progress;
          break;
        case "ease-in":
          value = math.ease_in(progress);
          break;
        case "ease-out":
          value = math.ease_out(progress);
          break;
      }
      this.scale = math.lerp(value, anim.from, anim.to);
      if (progress == 1) {
        this.StopScaling();
      }
    }
    if (this._shaking) {
      const anim = this._shaking;
      anim.counter += elapsedTimeS * 1e3;
      const progress = Math.min(anim.counter / anim.dur, 1);
      this.position.Sub(this._offset);
      this._offset.Copy(new Vector(Math.sin(progress * Math.PI * 2 * anim.count) * anim.range, 0).Rotate(anim.angle));
      this.position.Add(this._offset);
      if (progress == 1) {
        this.StopShaking();
      }
    }
  }
};

// src/core/component.js
var Component = class {
  constructor(params) {
    this._type = "";
    this._parent = null;
    this._position = new Position();
  }
  get type() {
    return this._type;
  }
  get scene() {
    return this._parent._scene;
  }
  get parent() {
    return this._parent;
  }
  get position() {
    return this._position.position;
  }
  set position(p) {
    this._position.position = p;
  }
  get offset() {
    return this._position._offset;
  }
  set offset(vec) {
    this._position._offset.Copy(vec);
  }
  InitComponent() {
  }
  GetComponent(n) {
    return this._parent.GetComponent(n);
  }
  FindEntity(n) {
    return this._parent.FindEntity(n);
  }
  Update(_) {
  }
};

// src/core/utils/param-parser.js
var ParamParser = function() {
  return {
    ParseValue(data, val) {
      if (data != void 0 && typeof data == typeof val) {
        return data;
      }
      return val;
    },
    ParseObject(data, obj) {
      if (data) {
        for (let attr in obj) {
          obj[attr] = typeof obj[attr] == "object" ? this.ParseObject(data[attr], obj[attr]) : this.ParseValue(data[attr], obj[attr]);
        }
      }
      return obj;
    }
  };
}();

// src/core/interactive.js
var Interactive = class extends Component {
  constructor(params) {
    super();
    this._capture = ParamParser.ParseValue(params.capture, true);
    this._eventHandlers = new Map();
  }
  On(type, handler) {
    if (!this._eventHandlers.has(type)) {
      this._eventHandlers.set(type, []);
    }
    const handlers = this._eventHandlers.get(type);
    handlers.push(handler);
  }
  Off(type, handler) {
    if (!this._eventHandlers.has(type)) {
      return;
    }
    const handlers = this._eventHandlers.get(type);
    const idx = handlers.indexOf(handler);
    if (idx > -1) {
      handlers.splice(idx, 1);
    }
  }
  _On(type, event) {
    if (!this._eventHandlers.has(type)) {
      return;
    }
    const handlers = this._eventHandlers.get(type);
    for (let handler of handlers) {
      handler(event);
    }
  }
};

// src/core/entity.js
var Entity = class {
  constructor() {
    this._position = new Position(this.DoWeirdStuff.bind(this));
    this._components = new Map();
    this._parent = null;
    this._name = null;
    this._scene = null;
    this.groupList = new Set();
  }
  get name() {
    return this._name;
  }
  get scene() {
    return this._scene;
  }
  get position() {
    return this._position.position;
  }
  set position(p) {
    this._position.position = p;
  }
  get moving() {
    return this._position._moving;
  }
  DoWeirdStuff() {
    this._components.forEach((c) => {
      c.position.Copy(this.position.Clone().Add(c.offset));
    });
  }
  Update(elapsedTimeS) {
    this._position.Update(elapsedTimeS);
    this._components.forEach((c) => {
      c.Update(elapsedTimeS);
    });
  }
  Clip(e, fixed = false) {
    this._position.Clip(e._position, fixed);
  }
  Unclip(e) {
    this._position.Unclip(e._position);
  }
  MoveTo(p, dur, timing = "linear") {
    this._position.MoveTo(p, dur, timing);
  }
  StopMoving() {
    this._position.StopMoving();
  }
  AddComponent(c, n) {
    if (n === void 0) {
      n = c.constructor.name;
    }
    this._components.set(n, c);
    c._parent = this;
    c.position.Copy(this.position.Clone().Add(c.offset));
    this.Clip(c, true);
    c.InitComponent();
    switch (c.type) {
      case "drawable":
        this.scene._AddDrawable(c);
        break;
      case "body":
        this.scene._AddBody(this, c);
        break;
      case "light":
        this._scene._lights.push(c);
    }
  }
  GetComponent(n) {
    return this._components.get(n);
  }
  FindEntity(n) {
    return this._parent.Get(n);
  }
};

// src/core/physics/physics.js
var physics_exports = {};
__export(physics_exports, {
  Ball: () => Ball,
  Box: () => Box,
  Ray: () => Ray,
  RegularPolygon: () => RegularPolygon,
  World: () => World
});

// src/core/spatial-hash-grid.js
var SpatialHashGrid = class {
  constructor(bounds, dimensions) {
    const [x, y] = dimensions;
    this._cells = [...Array(y)].map((_) => [...Array(x)].map((_2) => null));
    this._dimensions = dimensions;
    this._bounds = bounds;
  }
  NewClient(position, dimensions) {
    const client = {
      position,
      dimensions,
      indices: null
    };
    this._InsertClient(client);
    return client;
  }
  _InsertClient(client) {
    const [w, h] = client.dimensions;
    const [x, y] = client.position;
    const i1 = this._GetCellIndex([x - w / 2, y - h / 2]);
    const i2 = this._GetCellIndex([x + w / 2, y + h / 2]);
    client.indices = [i1, i2];
    for (let y2 = i1[1]; y2 <= i2[1]; ++y2) {
      for (let x2 = i1[0]; x2 <= i2[0]; ++x2) {
        if (!this._cells[y2][x2]) {
          this._cells[y2][x2] = new Set();
        }
        this._cells[y2][x2].add(client);
      }
    }
  }
  _GetCellIndex(position) {
    const x = math.sat((position[0] - this._bounds[0][0]) / (this._bounds[1][0] - this._bounds[0][0]));
    const y = math.sat((position[1] - this._bounds[0][1]) / (this._bounds[1][1] - this._bounds[0][1]));
    const xIndex = Math.floor(x * (this._dimensions[0] - 1));
    const yIndex = Math.floor(y * (this._dimensions[1] - 1));
    return [xIndex, yIndex];
  }
  FindNear(position, bounds) {
    const [w, h] = bounds;
    const [x, y] = position;
    const i1 = this._GetCellIndex([x - w / 2, y - h / 2]);
    const i2 = this._GetCellIndex([x + w / 2, y + h / 2]);
    const clients = new Set();
    for (let y2 = i1[1]; y2 <= i2[1]; ++y2) {
      for (let x2 = i1[0]; x2 <= i2[0]; ++x2) {
        if (this._cells[y2][x2]) {
          for (let v of this._cells[y2][x2]) {
            clients.add(v);
          }
        }
      }
    }
    return Array.from(clients);
  }
  UpdateClient(client) {
    this.RemoveClient(client);
    this._InsertClient(client);
  }
  RemoveClient(client) {
    const [i1, i2] = client.indices;
    for (let y = i1[1]; y <= i2[1]; ++y) {
      for (let x = i1[0]; x <= i2[0]; ++x) {
        this._cells[y][x].delete(client);
      }
    }
  }
  Draw(ctx) {
    const bounds = this._bounds;
    ctx.save();
    ctx.strokeStyle = "white";
    ctx.beginPath();
    const cellWidth = (bounds[1][0] - bounds[0][0]) / this._dimensions[0];
    for (let x = 0; x <= this._dimensions[0]; ++x) {
      ctx.moveTo(bounds[0][0] + x * cellWidth, bounds[0][1]);
      ctx.lineTo(bounds[0][0] + x * cellWidth, bounds[1][1]);
    }
    const cellHeight = (bounds[1][1] - bounds[0][1]) / this._dimensions[1];
    for (let y = 0; y <= this._dimensions[1]; ++y) {
      ctx.moveTo(bounds[0][0], bounds[0][1] + y * cellHeight);
      ctx.lineTo(bounds[1][0], bounds[0][1] + y * cellHeight);
    }
    ctx.stroke();
    ctx.restore();
  }
};

// src/core/quadtree.js
var AABB = class {
  constructor(x, y, w, h, userData) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.entity = userData;
  }
  _vsAabb(aabb) {
    if (this.x + this.w / 2 >= aabb.x - aabb.w / 2 && this.x - this.w / 2 <= aabb.x + aabb.w / 2 && this.y + this.h / 2 >= aabb.y - aabb.h / 2 && this.y - this.h / 2 <= aabb.y + aabb.h / 2) {
      return true;
    } else {
      return false;
    }
  }
};
var QuadTree = class {
  constructor(bounds, limit) {
    this._bounds = bounds;
    const w = bounds[1][0] - bounds[0][0];
    const h = bounds[1][1] - bounds[0][1];
    this.aabb = new AABB(bounds[0][0] + w / 2, bounds[0][1] + h / 2, w, h);
    this.limit = limit;
    this.divided = false;
    this.data = [];
  }
  _divide() {
    const bounds = this._bounds;
    const w = bounds[1][0] - bounds[0][0];
    const h = bounds[1][1] - bounds[0][1];
    this.topLeft = new QuadTree([[bounds[0][0], bounds[0][1]], [bounds[0][0] + w / 2, bounds[0][1] + h / 2]], this.limit);
    this.topRight = new QuadTree([[bounds[0][0] + w / 2, bounds[0][1]], [bounds[0][0] + w, bounds[0][1] + h / 2]], this.limit);
    this.bottomLeft = new QuadTree([[bounds[0][0], bounds[0][1] + h / 2], [bounds[0][0] + w / 2, bounds[0][1] + h]], this.limit);
    this.bottomRight = new QuadTree([[bounds[0][0] + w / 2, bounds[0][1] + h / 2], [bounds[0][0] + w, bounds[0][1] + h]], this.limit);
    for (let i2 = 0; i2 < this.data.length; i2++) {
      this.topLeft._Insert(this.data[i2]);
      this.topRight._Insert(this.data[i2]);
      this.bottomLeft._Insert(this.data[i2]);
      this.bottomRight._Insert(this.data[i2]);
    }
    this.divided = true;
  }
  Clear() {
    this.data = [];
    this.divided = false;
    this.topRight = null;
    this.topLeft = null;
    this.bottomLeft = null;
    this.bottomRight = null;
  }
  FindNear(position, bounds) {
    const [w, h] = bounds;
    const [x, y] = position;
    const aabb = new AABB(x, y, w, h);
    const res = this._Search(aabb);
    return res == void 0 ? [] : Array.from(res);
  }
  _Search(aabb, _res) {
    if (_res == void 0) {
      _res = new Set();
    }
    if (!aabb._vsAabb(this.aabb))
      return;
    if (!this.divided) {
      for (let i2 = 0; i2 < this.data.length; i2++) {
        if (aabb._vsAabb(this.data[i2])) {
          _res.add(this.data[i2]);
        }
      }
    } else {
      this.topLeft._Search(aabb, _res);
      this.topRight._Search(aabb, _res);
      this.bottomLeft._Search(aabb, _res);
      this.bottomRight._Search(aabb, _res);
    }
    return _res;
  }
  NewClient(position, dimensions) {
    const aabb = new AABB(position[0], position[1], dimensions[0], dimensions[1]);
    this._Insert(aabb);
    return aabb;
  }
  _Insert(aabb, depth = 0) {
    const maxRecursionDepth = 5;
    if (!this.aabb._vsAabb(aabb)) {
      return false;
    }
    if (this.data.length < this.limit || depth > maxRecursionDepth) {
      this.data.push(aabb);
      return true;
    } else {
      if (!this.divided) {
        this._divide();
      }
      this.topLeft._Insert(aabb, depth + 1);
      this.topRight._Insert(aabb, depth + 1);
      this.bottomLeft._Insert(aabb, depth + 1);
      this.bottomRight._Insert(aabb, depth + 1);
    }
  }
  UpdateClient(aabb) {
    this._Insert(aabb);
  }
  Draw(ctx) {
    ctx.beginPath();
    ctx.strokeStyle = "white";
    ctx.strokeRect(this.aabb.x - this.aabb.w / 2, this.aabb.y - this.aabb.h / 2, this.aabb.w, this.aabb.h);
    if (this.divided) {
      this.topLeft.Draw(ctx);
      this.topRight.Draw(ctx);
      this.bottomLeft.Draw(ctx);
      this.bottomRight.Draw(ctx);
    }
  }
};

// src/core/quadtree-controller.js
var QuadtreeController = class extends Component {
  constructor(params) {
    super();
    this._params = params;
    this._width = this._params.width;
    this._height = this._params.height;
    this._quadtree = this._params.quadtree;
  }
  InitComponent() {
    const pos = [
      this._parent.body.position.x,
      this._parent.body.position.y
    ];
    this._client = this._quadtree.NewClient(pos, [this._width, this._height]);
    this._client.entity = this._parent;
  }
  FindNearby(rangeX, rangeY) {
    const results = this._quadtree.FindNear([this._parent.position.x, this._parent.position.y], [rangeX, rangeY]);
    return results.filter((c) => c.entity != this._parent).map((c) => c.entity);
  }
  UpdateClient() {
    const pos = [
      this._parent.body.position.x,
      this._parent.body.position.y
    ];
    this._client.x = pos[0];
    this._client.y = pos[1];
    this._quadtree.UpdateClient(this._client);
  }
};

// src/core/physics/physics.js
var World = class {
  constructor(params = {}) {
    this._relaxationCount = ParamParser.ParseValue(params.iterations, 3);
    this._bounds = ParamParser.ParseValue(params.bounds, [[-1e3, -1e3], [1e3, 1e3]]);
    this._cellDimensions = ParamParser.ParseObject(params.cellDimensions, { width: 100, height: 100 });
    this._limit = ParamParser.ParseValue(params.limit, 10);
    this._bodies = [];
    this._joints = [];
    const cellCountX = Math.floor((this._bounds[1][0] - this._bounds[0][0]) / this._cellDimensions.width);
    const cellCountY = Math.floor((this._bounds[1][1] - this._bounds[0][1]) / this._cellDimensions.height);
    this._spatialGrid = new SpatialHashGrid(this._bounds, [cellCountX, cellCountY]);
    this._quadtree = new QuadTree(this._bounds, this._limit);
  }
  _AddJoint(j) {
    this._joints.push(j);
  }
  _AddBody(e, b) {
    e.body = b;
    const boundingRect = b.boundingRect;
    const treeController = new QuadtreeController({
      quadtree: this._quadtree,
      width: boundingRect.width,
      height: boundingRect.height
    });
    e.AddComponent(treeController);
    this._bodies.push(b);
  }
  _RemoveBody(e, b) {
    const i2 = this._bodies.indexOf(b);
    if (i2 != -1) {
      this._bodies.splice(i2, 1);
    }
  }
  Update(elapsedTimeS) {
    for (let body of this._bodies) {
      body._collisions.left.clear();
      body._collisions.right.clear();
      body._collisions.top.clear();
      body._collisions.bottom.clear();
      body._collisions.all.clear();
    }
    for (let body of this._bodies) {
      body.UpdatePosition(elapsedTimeS);
    }
    for (let joint of this._joints) {
      joint.Update(elapsedTimeS);
    }
    for (let i2 = 0; i2 < this._relaxationCount; ++i2) {
      for (let body of this._bodies) {
        body.HandleBehavior();
      }
    }
    this._quadtree.Clear();
    for (let body of this._bodies) {
      const treeController = body.GetComponent("QuadtreeController");
      treeController.UpdateClient();
    }
  }
};
var Body = class extends Component {
  constructor(params) {
    super();
    this._type = "body";
    this._vel = new Vector();
    this.passiveVelocity = new Vector();
    this._angVel = 0;
    this.mass = ParamParser.ParseValue(params.mass, 0);
    this.bounce = ParamParser.ParseValue(params.bounce, 0);
    this.angle = 0;
    this.rotating = ParamParser.ParseValue(params.rotating, 1);
    this.friction = ParamParser.ParseObject(params.friction, { x: 0, y: 0, angular: 0, normal: 0 });
    this._behavior = [];
    this._collisions = {
      left: new Set(),
      right: new Set(),
      top: new Set(),
      bottom: new Set(),
      all: new Set()
    };
    this.disabled = ParamParser.ParseObject(params.disabled, {
      axes: { x: false, y: false },
      sides: { left: false, right: false, top: false, bottom: false }
    });
    this.followBottomObject = ParamParser.ParseValue(params.followBottomObject, false);
  }
  get velocity() {
    return this._vel;
  }
  set velocity(vec) {
    this._vel.Copy(vec);
  }
  get angularVelocity() {
    return this._angVel;
  }
  set angularVelocity(num) {
    this._angVel = num;
  }
  get inverseMass() {
    return this.mass === 0 ? 0 : 1 / this.mass;
  }
  get inertia() {
    return 0;
  }
  get boundingRect() {
    return { width: 0, height: 0 };
  }
  get collisions() {
    return this._collisions;
  }
  Draw(ctx) {
    const bb = this.boundingRect;
    ctx.beginPath();
    ctx.strokeStyle = "lime";
    ctx.strokeRect(-bb.width / 2, -bb.height / 2, bb.width, bb.height);
  }
  AddBehavior(groups, type, action) {
    this._behavior.push({
      groups: groups.split(" "),
      type,
      action
    });
  }
  UpdatePosition(elapsedTimeS) {
    const decceleration = 60;
    const frame_decceleration = new Vector(this._vel.x * this.friction.x * decceleration, this._vel.y * this.friction.y * decceleration);
    this._vel.Sub(frame_decceleration.Mult(elapsedTimeS));
    const vel = this._vel.Clone().Mult(elapsedTimeS);
    this.position.Add(vel);
    this.position.Add(this.passiveVelocity.Clone().Mult(elapsedTimeS));
    this.passiveVelocity.Set(0, 0);
    this._angVel -= this._angVel * this.friction.angular * decceleration * elapsedTimeS;
    this.angle += this._angVel * elapsedTimeS;
  }
  HandleBehavior() {
    const controller = this.GetComponent("QuadtreeController");
    const boundingRect = this.boundingRect;
    for (let behavior of this._behavior) {
      const entities0 = controller.FindNearby(boundingRect.width, boundingRect.height);
      const entities = entities0.filter((e) => {
        return behavior.groups.map((g) => e.groupList.has(g)).some((_) => _);
      });
      entities.sort((a, b) => {
        const boundingRectA = a.body.boundingRect;
        const boundingRectB = b.body.boundingRect;
        const distA = Vector.Dist(this.position, a.body.position) / new Vector(boundingRect.width + boundingRectA.width, boundingRect.height + boundingRectA.height).Mag();
        const distB = Vector.Dist(this.position, b.body.position) / new Vector(boundingRect.width + boundingRectB.width, boundingRect.height + boundingRectB.height).Mag();
        return distA - distB;
      });
      for (let e of entities) {
        let info;
        switch (behavior.type) {
          case "DetectCollision":
            info = DetectCollision(this, e.body);
            if (info.collide) {
              if (behavior.action) {
                behavior.action(e.body, info.point);
              }
            }
            break;
          case "ResolveCollision":
            info = ResolveCollision(this, e.body);
            if (info.collide) {
              if (behavior.action) {
                behavior.action(e.body, info.point);
              }
            }
            break;
        }
      }
    }
  }
  Join(b, type, params) {
    let joint;
    switch (type) {
      case "spring":
        joint = new Spring(this, b, params);
        break;
      case "stick":
        joint = new Stick(this, b, params);
        break;
    }
    if (!joint) {
      return;
    }
    const world = this.scene._world;
    world._AddJoint(joint);
  }
  Contains(p) {
    return false;
  }
  ApplyForce(v, point) {
    const rPoint = this.position.Clone().Sub(point);
    const vel = v.Clone().Mult(1 / this.inverseMass);
    this.velocity.Add(vel);
    this.angularVelocity += Vector.Cross(rPoint, vel.Clone().Mult(1 / this.inertia));
  }
};
var Poly = class extends Body {
  constructor(params) {
    super(params);
    this._points = params.points;
  }
  GetVertices() {
    return this._points.map((v) => new Vector(v[0], v[1]));
  }
  GetComputedVertices() {
    const verts = this.GetVertices();
    for (let i2 = 0; i2 < verts.length; ++i2) {
      const v = verts[i2];
      v.Rotate(this.angle);
      v.Add(this.position);
    }
    return verts;
  }
  get boundingRect() {
    const verts = this.GetVertices();
    let maxDist = 0;
    let idx = 0;
    for (let i2 = 0; i2 < verts.length; ++i2) {
      const v = verts[i2];
      const dist = v.Mag();
      if (dist > maxDist) {
        maxDist = dist;
        idx = i2;
      }
    }
    const d = maxDist * 2;
    return {
      width: d,
      height: d
    };
  }
  static GetFaceNormals(vertices) {
    let normals = [];
    for (let i2 = 0; i2 < vertices.length; i2++) {
      let v1 = vertices[i2].Clone();
      let v2 = vertices[(i2 + 1) % vertices.length].Clone();
      normals[i2] = v2.Clone().Sub(v1).Norm().Unit();
    }
    return normals;
  }
  static FindSupportPoint(vertices, n, ptOnEdge) {
    let max = -Infinity;
    let index = -1;
    for (let i2 = 0; i2 < vertices.length; i2++) {
      let v = vertices[i2].Clone().Sub(ptOnEdge);
      let proj = Vector.Dot(v, n);
      if (proj > 0 && proj > max) {
        max = proj;
        index = i2;
      }
    }
    return { sp: vertices[index], depth: max };
  }
  Contains(p) {
    const verts = this.GetComputedVertices();
    const vertsLen = verts.length;
    let count = 0;
    for (let i2 = 0; i2 < vertsLen; ++i2) {
      const v1 = verts[i2];
      const v2 = verts[(i2 + 1) % vertsLen];
      if ((p.y - v1.y) * (p.y - v2.y) <= 0 && (p.x <= v1.x || p.x <= v2.x) && (v1.x >= p.x && v2.x >= p.x || (v2.x - v1.x) * (p.y - v1.y) / (v2.y - v1.y) >= p.x - v1.x)) {
        ++count;
      }
    }
    return count % 2;
  }
};
var Box = class extends Poly {
  constructor(params) {
    super(params);
    this._width = params.width;
    this._height = params.height;
    this._points = [
      [-this._width / 2, -this._height / 2],
      [this._width / 2, -this._height / 2],
      [this._width / 2, this._height / 2],
      [-this._width / 2, this._height / 2]
    ];
  }
  get width() {
    return this._width;
  }
  get height() {
    return this._height;
  }
  get inertia() {
    return (this.width ** 2 + this.height ** 2) / 1 / this.rotating;
  }
};
var Ball = class extends Body {
  constructor(params) {
    super(params);
    this._radius = params.radius;
  }
  get radius() {
    return this._radius;
  }
  get boundingRect() {
    return { width: 2 * this.radius, height: 2 * this.radius };
  }
  get inertia() {
    return Math.PI * this.radius ** 2 / 1 / this.rotating;
  }
  FindSupportPoint(n, ptOnEdge) {
    let circVerts = [];
    circVerts[0] = this.position.Clone().Add(n.Clone().Mult(this.radius));
    circVerts[1] = this.position.Clone().Add(n.Clone().Mult(-this.radius));
    let max = -Infinity;
    let index = -1;
    for (let i2 = 0; i2 < circVerts.length; i2++) {
      let v = circVerts[i2].Clone().Sub(ptOnEdge);
      let proj = Vector.Dot(v, n);
      if (proj > 0 && proj > max) {
        max = proj;
        index = i2;
      }
    }
    return { sp: circVerts[index], depth: max, n };
  }
  FindNearestVertex(vertices) {
    let dist = Infinity;
    let index = 0;
    for (let i2 = 0; i2 < vertices.length; i2++) {
      let l = Vector.Dist(vertices[i2], this.position);
      if (l < dist) {
        dist = l;
        index = i2;
      }
    }
    return vertices[index];
  }
  Contains(p) {
    return Vector.Dist(p, this.position) <= this.radius;
  }
};
var RegularPolygon = class extends Poly {
  constructor(params) {
    super(params);
    this._radius = params.radius;
    this._sides = params.sides;
    const points = [];
    for (let i2 = 0; i2 < this._sides; ++i2) {
      const angle = Math.PI * 2 / this._sides * i2;
      points.push([Math.cos(angle) * this._radius, Math.sin(angle) * this._radius]);
    }
    this._points = points;
  }
  get radius() {
    return this._radius;
  }
  get boundingRect() {
    return { width: 2 * this.radius, height: 2 * this.radius };
  }
  get inertia() {
    return Math.PI * this.radius ** 2 / 1 / this.rotating;
  }
};
var Ray = class extends Body {
  constructor(params) {
    super(params);
    this._range = params.range;
  }
  get range() {
    return this._range;
  }
  set range(num) {
    this._range = num;
  }
  get boundingRect() {
    return { width: 2 * this.range, height: 2 * this.range };
  }
  get point() {
    return this.position.Clone().Add(new Vector(this.range, 0).Rotate(this.angle));
  }
};
var DetectCollision = (b1, b2) => {
  if (b1 instanceof Ball && b2 instanceof Ball) {
    return DetectCollisionBallVsBall(b1, b2);
  } else if (b1 instanceof Poly && b2 instanceof Poly) {
    return DetectCollisionPolyVsPoly(b1, b2);
  } else if (b1 instanceof Ball && b2 instanceof Poly) {
    return DetectCollisionBallVsPoly(b1, b2);
  } else if (b1 instanceof Poly && b2 instanceof Ball) {
    return DetectCollisionBallVsPoly(b2, b1);
  } else if (b1 instanceof Ray && b2 instanceof Poly) {
    return DetectCollisionRayVsPoly(b1, b2);
  } else if (b1 instanceof Poly && b2 instanceof Ray) {
    return DetectCollisionRayVsPoly(b2, b1);
  } else if (b1 instanceof Ray && b2 instanceof Ball) {
    return DetectCollisionRayVsBall(b1, b2);
  } else if (b1 instanceof Ball && b2 instanceof Ray) {
    return DetectCollisionRayVsBall(b2, b1);
  } else {
    return {
      collide: false
    };
  }
};
var DetectCollisionLineVsLine = (a, b, c, d) => {
  const r = b.Clone().Sub(a);
  const s = d.Clone().Sub(c);
  const den = r.x * s.y - r.y * s.x;
  const u = ((c.x - a.x) * r.y - (c.y - a.y) * r.x) / den;
  const t = ((c.x - a.x) * s.y - (c.y - a.y) * s.x) / den;
  if (0 <= u && u <= 1 && 0 <= t && t <= 1) {
    return {
      collide: true,
      point: a.Clone().Add(r.Clone().Mult(t))
    };
  }
  return {
    collide: false
  };
};
var DetectCollisionRayVsPoly = (ray, b) => {
  const rayPoint = ray.point;
  let minDist = Infinity;
  let point = null;
  const vertices = b.GetComputedVertices();
  for (let i2 = 0; i2 < vertices.length; ++i2) {
    const v1 = vertices[i2];
    const v2 = vertices[(i2 + 1) % vertices.length];
    const info = DetectCollisionLineVsLine(ray.position, rayPoint, v1, v2);
    if (info.collide) {
      const dist = Vector.Dist(ray.position, info.point);
      if (dist < minDist) {
        minDist = dist;
        point = info.point;
      }
    }
  }
  if (point != null) {
    ray._collisions.all.add(b);
    b._collisions.all.add(ray);
    return {
      collide: true,
      point
    };
  }
  return {
    collide: false
  };
};
var DetectCollisionRayVsBall = (ray, b) => {
  const rayPoint = ray.point;
  const rayVec = rayPoint.Clone().Sub(ray.position).Unit();
  const originToBall = b.position.Clone().Sub(ray.position);
  const r2 = b.radius ** 2;
  const originToBallLength2 = originToBall.Mag() ** 2;
  const a = Vector.Dot(originToBall, rayVec);
  const bsq = originToBallLength2 - a * a;
  if (r2 - bsq < 0) {
    return {
      collide: false
    };
  }
  const f = Math.sqrt(r2 - bsq);
  let t;
  if (originToBallLength2 < r2) {
    t = a + f;
  } else {
    t = a - f;
  }
  const point = ray.position.Clone().Add(rayVec.Clone().Mult(t));
  if (Vector.Dot(point.Clone().Sub(ray.position), rayPoint.Clone().Sub(ray.position)) < 0 || Vector.Dist(point, ray.position) > ray.range) {
    return {
      collide: false
    };
  }
  ray._collisions.all.add(b);
  b._collisions.all.add(ray);
  return {
    collide: true,
    point
  };
};
var DetectCollisionBallVsBall = (b1, b2) => {
  let v = b1.position.Clone().Sub(b2.position);
  let info = {};
  if (v.Mag() < b1.radius + b2.radius) {
    info.normal = v.Clone().Unit();
    info.depth = b1.radius + b2.radius - v.Mag();
    info.point = b1.position.Clone().Add(info.normal.Clone().Mult(b1.radius));
    info.collide = true;
    b1._collisions.all.add(b2);
    b2._collisions.all.add(b1);
    return info;
  }
  return {
    collide: false
  };
};
var DetectCollisionPolyVsPoly = (b1, b2) => {
  const verts1 = b1.GetComputedVertices();
  const verts2 = b2.GetComputedVertices();
  const normals1 = Poly.GetFaceNormals(verts1);
  const normals2 = Poly.GetFaceNormals(verts2);
  let e1SupportPoints = [];
  for (let i2 = 0; i2 < normals1.length; i2++) {
    let spInfo = Poly.FindSupportPoint(verts2, normals1[i2].Clone().Mult(-1), verts1[i2]);
    spInfo.n = normals1[i2].Clone();
    e1SupportPoints[i2] = spInfo;
    if (spInfo.sp == void 0)
      return { collide: false };
  }
  let e2SupportPoints = [];
  for (let i2 = 0; i2 < normals2.length; i2++) {
    let spInfo = Poly.FindSupportPoint(verts1, normals2[i2].Clone().Mult(-1), verts2[i2]);
    spInfo.n = normals2[i2].Clone();
    e2SupportPoints[i2] = spInfo;
    if (spInfo.sp == void 0)
      return { collide: false };
  }
  e1SupportPoints = e1SupportPoints.concat(e2SupportPoints);
  let max = Infinity;
  let index = 0;
  for (let i2 = 0; i2 < e1SupportPoints.length; i2++) {
    if (e1SupportPoints[i2].depth < max) {
      max = e1SupportPoints[i2].depth;
      index = i2;
    }
  }
  let v = b2.position.Clone().Sub(b1.position);
  if (Vector.Dot(v, e1SupportPoints[index].n) > 0) {
    e1SupportPoints[index].n.Mult(-1);
  }
  b1._collisions.all.add(b2);
  b2._collisions.all.add(b1);
  return {
    collide: true,
    normal: e1SupportPoints[index].n,
    depth: e1SupportPoints[index].depth,
    point: e1SupportPoints[index].sp
  };
};
var DetectCollisionBallVsPoly = (b1, b2) => {
  const verts = b2.GetComputedVertices();
  const normals = Poly.GetFaceNormals(verts);
  let e1SupportPoints = [];
  for (let i2 = 0; i2 < normals.length; i2++) {
    let info2 = b1.FindSupportPoint(normals[i2].Clone().Mult(-1), verts[i2].Clone());
    if (info2.sp == void 0)
      return { collide: false };
    e1SupportPoints[i2] = info2;
  }
  let nearestVertex = b1.FindNearestVertex(verts);
  let normal = nearestVertex.Clone().Sub(b1.position).Unit();
  let info = Poly.FindSupportPoint(verts, normal.Clone(), b1.position.Clone());
  if (info.sp == void 0)
    return { collide: false };
  info.n = normal.Clone();
  e1SupportPoints.push(info);
  let max = Infinity;
  let index = null;
  for (let i2 = 0; i2 < e1SupportPoints.length; i2++) {
    if (e1SupportPoints[i2].depth < max) {
      max = e1SupportPoints[i2].depth;
      index = i2;
    }
  }
  let v = b2.position.Clone().Sub(b1.position);
  if (Vector.Dot(v, e1SupportPoints[index].n) < 0) {
    e1SupportPoints[index].n.Mult(-1);
  }
  b1._collisions.all.add(b2);
  b2._collisions.all.add(b1);
  return {
    collide: true,
    normal: e1SupportPoints[index].n,
    point: e1SupportPoints[index].sp,
    depth: e1SupportPoints[index].depth
  };
};
var ResolveCollision = (b1, b2) => {
  if (b1 instanceof Ball && b2 instanceof Poly) {
    [b1, b2] = [b2, b1];
  }
  const detect = DetectCollision(b1, b2);
  if (detect.collide) {
    const res = {
      collide: true,
      point: detect.point
    };
    if (b1.mass === 0 && b2.mass === 0)
      return res;
    if (b1.disabled.axes.x || b2.disabled.axes.x) {
      detect.normal.x = 0;
    }
    if (b1.disabled.axes.y || b2.disabled.axes.y) {
      detect.normal.y = 0;
    }
    const directions = {
      left: new Vector(-1, 0),
      right: new Vector(1, 0),
      top: new Vector(0, -1),
      bottom: new Vector(0, 1)
    };
    let direction;
    if (Vector.Dot(detect.normal, directions.left) >= Math.SQRT2 / 2) {
      direction = "left";
    } else if (Vector.Dot(detect.normal, directions.right) >= Math.SQRT2 / 2) {
      direction = "right";
    } else if (Vector.Dot(detect.normal, directions.top) >= Math.SQRT2 / 2) {
      direction = "top";
    } else if (Vector.Dot(detect.normal, directions.bottom) >= Math.SQRT2 / 2) {
      direction = "bottom";
    }
    const r1 = detect.point.Clone().Sub(b1.position);
    const r2 = detect.point.Clone().Sub(b2.position);
    const w1 = b1.angularVelocity;
    const w2 = b2.angularVelocity;
    const v1 = b1._vel;
    const v2 = b2._vel;
    const vp1 = v1.Clone().Add(new Vector(-w1 * r1.y, w1 * r1.x));
    const vp2 = v2.Clone().Add(new Vector(-w2 * r2.y, w2 * r2.x));
    const relVel = vp1.Clone().Sub(vp2);
    const bounce = Math.max(b1.bounce, b2.bounce);
    const j = -(1 + bounce) * Vector.Dot(relVel, detect.normal) / (b1.inverseMass + b2.inverseMass + Math.pow(Vector.Cross(r1, detect.normal), 2) / b1.inertia + Math.pow(Vector.Cross(r2, detect.normal), 2) / b2.inertia);
    const jn = detect.normal.Clone().Mult(j);
    const vel1 = jn.Clone().Mult(b1.inverseMass);
    const vel2 = jn.Clone().Mult(b2.inverseMass);
    if ((Vector.Dot(jn, directions.left) >= Math.SQRT2 / 2 || Vector.Dot(jn, directions.left) < Math.SQRT2 / 2 && direction == "left") && (b1.disabled.sides.right || b2.disabled.sides.left)) {
      return res;
    } else if ((Vector.Dot(jn, directions.right) >= Math.SQRT2 / 2 || Vector.Dot(jn, directions.right) < Math.SQRT2 / 2 && direction == "right") && (b1.disabled.sides.left || b2.disabled.sides.right)) {
      return res;
    } else if ((Vector.Dot(jn, directions.top) >= Math.SQRT2 / 2 || Vector.Dot(jn, directions.top) < Math.SQRT2 / 2 && direction == "top") && (b1.disabled.sides.bottom || b2.disabled.sides.top)) {
      return res;
    } else if ((Vector.Dot(jn, directions.bottom) >= Math.SQRT2 / 2 || Vector.Dot(jn, directions.bottom) < Math.SQRT2 / 2 && direction == "bottom") && (b1.disabled.sides.top || b2.disabled.sides.bottom)) {
      return res;
    }
    const diff = detect.normal.Clone().Mult(detect.depth / (b1.inverseMass + b2.inverseMass));
    b1.position.Add(diff.Clone().Mult(b1.inverseMass));
    b2.position.Sub(diff.Clone().Mult(b2.inverseMass));
    const relVelDotN = Vector.Dot(relVel, detect.normal);
    if (relVelDotN <= 0) {
      b1._vel.Add(vel1);
      b2._vel.Sub(vel2);
      b1.angularVelocity += Vector.Cross(r1, vel1.Clone().Mult(1 / b1.inertia));
      b2.angularVelocity -= Vector.Cross(r2, vel2.Clone().Mult(1 / b1.inertia));
      const friction = Math.max(b1.friction.normal, b2.friction.normal);
      const tangent = detect.normal.Clone().Norm();
      const j2 = -(1 + bounce) * Vector.Dot(relVel, tangent) * friction / (b1.inverseMass + b2.inverseMass + Math.pow(Vector.Cross(r1, tangent), 2) / b1.inertia + Math.pow(Vector.Cross(r2, tangent), 2) / b2.inertia);
      const jt = tangent.Clone().Mult(j2);
      const vel1a = jt.Clone().Mult(b1.inverseMass);
      const vel2a = jt.Clone().Mult(b2.inverseMass);
      b1._vel.Add(vel1a.Clone());
      b2._vel.Sub(vel2a.Clone());
      b1.angularVelocity += Vector.Cross(r1, vel1a.Clone().Mult(1 / b1.inertia));
      b2.angularVelocity -= Vector.Cross(r2, vel2a.Clone().Mult(1 / b2.inertia));
      switch (direction) {
        case "left":
          b1._collisions.right.add(b2);
          b2._collisions.left.add(b1);
          break;
        case "right":
          b1._collisions.left.add(b2);
          b2._collisions.right.add(b1);
          break;
        case "top":
          b1._collisions.bottom.add(b2);
          b2._collisions.top.add(b1);
          break;
        case "bottom":
          b1._collisions.top.add(b2);
          b2._collisions.bottom.add(b1);
          break;
      }
    }
    if (direction == "bottom") {
      if (b2.followBottomObject)
        b2.passiveVelocity.Copy(b1.velocity);
    } else if (direction == "top") {
      if (b1.followBottomObject)
        b1.passiveVelocity.Copy(b2.velocity);
    }
    return res;
  }
  return {
    collide: false
  };
};
var Joint = class {
  constructor(b1, b2, params) {
    this._body1 = b1;
    this._body2 = b2;
    const offset1 = ParamParser.ParseObject(params.offset1, { x: 0, y: 0 });
    this._offset1 = new Vector(offset1.x, offset1.y);
    const offset2 = ParamParser.ParseObject(params.offset2, { x: 0, y: 0 });
    this._offset2 = new Vector(offset2.x, offset2.y);
    const start = this._body1.position.Clone().Add(this._offset1.Clone().Rotate(this._body1.angle));
    const end = this._body2.position.Clone().Add(this._offset2.Clone().Rotate(this._body2.angle));
    this._length = ParamParser.ParseValue(params.length, Vector.Dist(start, end));
  }
  Update(_) {
  }
};
var Spring = class extends Joint {
  constructor(b1, b2, params) {
    super(b1, b2, params);
    this._stiffness = ParamParser.ParseValue(params.stiffness, 0) * 10;
  }
  Update() {
    const offset1 = this._offset1.Clone().Rotate(this._body1.angle);
    const offset2 = this._offset2.Clone().Rotate(this._body2.angle);
    const start = this._body1.position.Clone().Add(offset1);
    const end = this._body2.position.Clone().Add(offset2);
    const vec = start.Clone().Sub(end);
    const n = vec.Clone().Unit();
    const dist = vec.Mag();
    const diff = n.Clone().Mult((dist - this._length) * -this._stiffness / (this._body1.inverseMass + this._body2.inverseMass));
    const vel1 = diff.Clone().Mult(this._body1.inverseMass);
    this._body1.velocity.Add(vel1.Clone().Mult(1));
    this._body1.angularVelocity += Vector.Cross(offset1, vel1.Clone().Mult(1 / this._body1.inertia));
    const vel2 = diff.Clone().Mult(this._body2.inverseMass);
    this._body2.velocity.Sub(vel2.Clone().Mult(1));
    this._body2.angularVelocity -= Vector.Cross(offset2, vel2.Clone().Mult(1 / this._body2.inertia));
  }
};
var Stick = class extends Joint {
  constructor(b1, b2, params) {
    super(b1, b2, params);
  }
  Update() {
    const offset1 = this._offset1.Clone().Rotate(this._body1.angle);
    const offset2 = this._offset2.Clone().Rotate(this._body2.angle);
    const start = this._body1.position.Clone().Add(offset1);
    const end = this._body2.position.Clone().Add(offset2);
    const vec = start.Clone().Sub(end);
    const n = vec.Clone().Unit();
    const dist = vec.Mag();
    const diff = n.Clone().Mult((dist - this._length) * -this._stiffness / (this._body1.inverseMass + this._body2.inverseMass));
  }
};

// src/core/light/light.js
var light_exports = {};
__export(light_exports, {
  AmbientLight: () => AmbientLight,
  RadialLight: () => RadialLight
});
var AmbientLight = class {
  constructor(params) {
    this._color = ParamParser.ParseValue(params.color, "white");
  }
  get color() {
    return this._color;
  }
  set color(col) {
    this._color = col;
  }
  Draw(ctx) {
    ctx.beginPath();
    ctx.fillStyle = StyleParser.ParseColor(ctx, this.color);
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  }
};
var RadialLight = class extends Component {
  constructor(params) {
    super();
    this._type = "light";
    this._color = ParamParser.ParseValue(params.color, "white");
    this.radius = ParamParser.ParseValue(params.radius, 100);
    this.angle = 0;
    this.angleRange = ParamParser.ParseValue(params.angleRange, Math.PI * 2);
  }
  get color() {
    return this._color;
  }
  set color(col) {
    this._color = col;
  }
  Draw(ctx) {
    ctx.beginPath();
    ctx.save();
    ctx.translate(this.position.x, this.position.y);
    ctx.rotate(this.angle);
    ctx.fillStyle = StyleParser.ParseColor(ctx, this.color);
    ctx.arc(0, 0, this.radius, -this.angleRange / 2, this.angleRange / 2);
    ctx.lineTo(0, 0);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
};

// src/core/scene.js
var Scene = class {
  constructor(params) {
    this._zIndex = 0;
    this._background = params.background;
    this._world = new World(params.physics);
    this.paused = true;
    this.speed = 1;
    this.timeout = new TimeoutHandler();
    this._lights = [];
    this._ambientLight = new AmbientLight({
      color: params.light || "white"
    });
    this._keys = new Set();
    this._drawable = [];
    this._interactiveEntities = [];
    this._eventHandlers = new Map();
    this._entityManager = new EntityManager();
    this._camera = new Camera();
  }
  get camera() {
    return this._camera;
  }
  set light(color) {
    this._ambientLight.color = color;
  }
  get background() {
    return this._background;
  }
  set background(col) {
    this._background = col;
  }
  IsPressed(k) {
    return this._keys.has(k);
  }
  CreateEntity(n) {
    const e = new Entity();
    this.AddEntity(e, n);
    return e;
  }
  On(type, handler) {
    if (!this._eventHandlers.has(type)) {
      this._eventHandlers.set(type, []);
    }
    const handlers = this._eventHandlers.get(type);
    handlers.push(handler);
  }
  Off(type, handler) {
    if (!this._eventHandlers.has(type)) {
      return;
    }
    const handlers = this._eventHandlers.get(type);
    const idx = handlers.indexOf(handler);
    if (idx > -1) {
      handlers.splice(idx, 1);
    }
  }
  SetInteractive(entity, params = {}) {
    this._interactiveEntities.push(entity);
    const interactive = new Interactive(params);
    entity.AddComponent(interactive);
    entity.interactive = interactive;
  }
  _On(type, event) {
    if (this.paused) {
      return false;
    }
    let result = false;
    if (this._eventHandlers.has(type)) {
      const handlers = this._eventHandlers.get(type);
      for (let handler of handlers) {
        handler(event);
      }
    }
    if (type == "mousedown") {
      const entities = this._world._quadtree.FindNear([event.x, event.y], [0, 0]).map((c) => c.entity);
      for (let e of entities) {
        if (!e.interactive) {
          continue;
        }
        if (e.body.Contains(new Vector(event.x, event.y))) {
          e.interactive._On(type, event);
          e.interactive._id = event.id;
          if (e.interactive._capture) {
            result = true;
          }
        }
      }
    } else if (type == "mousemove" || type == "mouseup") {
      for (let e of this._interactiveEntities) {
        if (e.interactive._id == event.id) {
          if (e.interactive._capture) {
            result = true;
          }
          e.interactive._On(type, event);
          if (type == "mouseup") {
            e.interactive._id = -1;
          }
        }
      }
    } else if (type == "keydown") {
      this._keys.add(event.key);
    } else if (type == "keyup") {
      this._keys.delete(event.key);
    }
    return result;
  }
  GetEntityByName(n) {
    return this._entityManager.Get(n);
  }
  GetEntitiesByGroup(g) {
    return this._entityManager.Filter((e) => e.groupList.has(g));
  }
  AddEntity(e, n) {
    e._scene = this;
    this._entityManager.Add(e, n);
  }
  RemoveEntity(e) {
    this._entityManager.Remove(e);
    e._components.forEach((c) => {
      if (c._type == "drawable") {
        this._RemoveDrawable(c);
      } else if (c._type == "body") {
        this._RemoveBody(e, c);
      } else if (c._type == "light") {
        const idx = this._lights.indexOf(c);
        this._lights.splice(idx, 1);
      }
    });
  }
  _AddDrawable(c) {
    this._drawable.push(c);
    for (let i2 = this._drawable.length - 1; i2 > 0; --i2) {
      if (c._zIndex >= this._drawable[i2 - 1]._zIndex) {
        break;
      }
      [this._drawable[i2], this._drawable[i2 - 1]] = [this._drawable[i2 - 1], this._drawable[i2]];
    }
  }
  _RemoveDrawable(c) {
    const i2 = this._drawable.indexOf(c);
    if (i2 != -1) {
      this._drawable.splice(i2, 1);
    }
  }
  _AddBody(e, b) {
    this._world._AddBody(e, b);
  }
  _RemoveBody(e, b) {
    this._world._RemoveBody(e, b);
  }
  _PhysicsUpdate(elapsedTimeS) {
    for (let body of this._bodies) {
      body._collisions.left.clear();
      body._collisions.right.clear();
      body._collisions.top.clear();
      body._collisions.bottom.clear();
    }
    for (let body of this._bodies) {
      body.UpdatePosition(elapsedTimeS);
    }
    for (let i2 = 0; i2 < this._relaxationCount; ++i2) {
      for (let body of this._bodies) {
        body.HandleBehavior();
      }
    }
  }
  Update(elapsedTimeS) {
    if (this.paused) {
      return;
    }
    this.timeout.Update(elapsedTimeS * 1e3);
    this._entityManager.Update(elapsedTimeS);
    this._world.Update(elapsedTimeS);
    this._camera.Update(elapsedTimeS);
  }
  Play() {
    this.paused = false;
  }
  Pause() {
    this.paused = true;
  }
  DrawLights(ctx, renderWidth, renderHeight) {
    ctx.globalCompositeOperation = "source-over";
    this._ambientLight.Draw(ctx);
    const cam = this.camera;
    ctx.globalCompositeOperation = "lighter";
    ctx.save();
    ctx.translate(-cam.position.x * cam.scale + renderWidth / 2, -cam.position.y * cam.scale + renderHeight / 2);
    ctx.scale(cam.scale, cam.scale);
    for (let light of this._lights) {
      light.Draw(ctx);
    }
    ctx.restore();
    ctx.globalCompositeOperation = "multiply";
  }
  DrawObjects(ctx, renderWidth, renderHeight) {
    const cam = this.camera;
    const buffer = document.createElement("canvas").getContext("2d");
    buffer.canvas.width = renderWidth;
    buffer.canvas.height = renderHeight;
    buffer.beginPath();
    buffer.fillStyle = StyleParser.ParseColor(buffer, this.background);
    buffer.fillRect(0, 0, renderWidth, renderHeight);
    buffer.save();
    buffer.translate(-cam.position.x * cam.scale + renderWidth / 2, -cam.position.y * cam.scale + renderHeight / 2);
    buffer.scale(cam.scale, cam.scale);
    for (let elem of this._drawable) {
      const boundingBox = elem.boundingBox;
      const pos = new Vector(boundingBox.x, boundingBox.y);
      pos.Sub(cam.position);
      pos.Mult(cam.scale);
      const [width, height] = [boundingBox.width, boundingBox.height].map((_) => _ * cam.scale);
      if (pos.x + width / 2 < -this._width / 2 || pos.x - width / 2 > this._width / 2 || pos.y + height / 2 < -this._height / 2 || pos.y - height / 2 > this._height / 2) {
        continue;
      }
      elem.Draw0(buffer);
    }
    buffer.restore();
    ctx.drawImage(buffer.canvas, 0, 0);
  }
};

// src/core/loader.js
var Loader = class {
  constructor() {
    this._toLoad = [];
    this._size = 0;
    this._counter = 0;
    this._path = "";
  }
  _Add(n, p, type) {
    let path;
    if (this._path == "") {
      path = p;
    } else if (p.startsWith("/")) {
      path = this._path + p.slice(1);
    } else {
      path = this._path + p;
    }
    this._toLoad.push({
      name: n,
      path,
      type
    });
    ++this._size;
  }
  AddImage(n, p) {
    this._Add(n, p, "image");
    return this;
  }
  AddAudio(n, p) {
    this._Add(n, p, "audio");
    return this;
  }
  AddJSON(n, p) {
    this._Add(n, p, "json");
    return this;
  }
  AddFont(n, p) {
    this._Add(n, p, "font");
    return this;
  }
  _HandleCallback(loaded, obj, e, cb) {
    loaded.set(obj.name, e);
    ++this._counter;
    this._HandleOnProgress(obj);
    if (this._counter === this._size) {
      this._counter = this._size = 0;
      this._toLoad = [];
      cb(loaded);
    }
  }
  _OnProgressHandler(value, obj) {
  }
  OnProgress(f) {
    this._OnProgressHandler = f;
    return this;
  }
  SetPath(p) {
    this._path = p;
    if (!this._path) {
      this._path += "/";
    }
    return this;
  }
  _HandleOnProgress(obj) {
    const value = this._counter / this._size;
    this._OnProgressHandler(value, obj);
  }
  Load(cb) {
    const loaded = new Map();
    if (this._size === 0) {
      cb(loaded);
      return;
    }
    for (let e of this._toLoad) {
      switch (e.type) {
        case "image":
          Loader.LoadImage(e.path, (elem) => {
            this._HandleCallback(loaded, e, elem, cb);
          });
          break;
        case "audio":
          Loader.LoadAudio(e.path, (elem) => {
            this._HandleCallback(loaded, e, elem, cb);
          });
          break;
        case "json":
          Loader.LoadJSON(e.path, (elem) => {
            this._HandleCallback(loaded, e, elem, cb);
          });
          break;
        case "font":
          Loader.LoadFont(e.name, e.path, (elem) => {
            this._HandleCallback(loaded, e, elem, cb);
          });
      }
    }
  }
  static LoadImage(p, cb) {
    const image = new Image();
    image.src = p;
    image.addEventListener("load", () => {
      cb(image);
    }, { once: true });
  }
  static LoadAudio(p, cb) {
    const audio = new Audio(p);
    audio.load();
    audio.addEventListener("canplaythrough", () => {
      cb(audio);
    }, { once: true });
  }
  static LoadJSON(p, cb) {
    fetch(p).then((response) => response.json()).then((json) => cb(json));
  }
  static LoadFont(n, p, cb) {
    const font = new FontFace(n, `url(${p})`);
    font.load().then((loadedFont) => {
      document.fonts.add(loadedFont);
      cb(n);
    });
  }
};

// src/core/game.js
var Game = class {
  constructor(params) {
    this._width = params.width;
    this._height = params.height;
    this._preload = params.preload == void 0 ? null : params.preload.bind(this);
    this._init = params.init.bind(this);
    this._resources = null;
    this._loader = new Loader();
    const body = document.body;
    body.style.userSelect = "none";
    body.style.touchAction = "none";
    body.style.position = "fixed";
    body.style.width = "100%";
    body.style.height = "100%";
    body.style.overflow = "hidden";
    body.style.margin = "0";
    body.style.padding = "0";
    body.style.background = "black";
    this._renderer = new Renderer({
      width: this._width,
      height: this._height
    });
    this._engine = new Engine();
    this._sceneManager = new SceneManager();
    const controls = ParamParser.ParseObject(params.controls, {
      active: false,
      layout: {
        joystick: { left: "a", right: "d", up: "w", down: "s" },
        X: "j",
        Y: "k",
        A: "l",
        B: "o",
        SL: "control",
        SR: "control",
        start: "enter",
        select: "space"
      }
    });
    if (controls.active && "ontouchstart" in document) {
      this._InitControls(controls.layout);
    }
    this.timeout = this._engine.timeout;
    this.audio = (() => {
      const sections = new Map();
      const CreateSection = (n) => {
        sections.set(n, new AudioSection());
      };
      const Play = (sectionName, audioName, params2 = {}) => {
        if (!sections.has(sectionName)) {
          CreateSection(sectionName);
        }
        const section = sections.get(sectionName);
        if (!section._audioMap.has(audioName)) {
          section.AddAudio(audioName, this._resources.get(audioName));
        }
        if (params2.primary === false) {
          section.PlaySecondary(audioName);
        } else {
          section.Play(audioName, params2);
        }
      };
      const Pause = (sectionName) => {
        sections.get(sectionName).Pause();
      };
      const SetVolume = (sectionName, volume) => {
        if (!sections.has(sectionName)) {
          CreateSection(sectionName);
        }
        sections.get(sectionName).volume = volume;
      };
      const IsPlaying = (sectionName) => {
        return sections.get(sectionName).playing;
      };
      const GetVolume = (sectionName) => {
        if (!sections.has(sectionName)) {
          CreateSection(sectionName);
        }
        return sections.get(sectionName).volume;
      };
      return {
        Play,
        Pause,
        SetVolume,
        IsPlaying,
        GetVolume
      };
    })();
    const draw = (ctx, idx = 0) => {
      const scene = this._sceneManager._scenes[idx];
      if (!scene) {
        return;
      }
      if (scene.paused) {
        draw(ctx, idx + 1);
        return;
      }
      const w = this._renderer._width;
      const h = this._renderer._height;
      scene.DrawLights(ctx, w, h);
      const b = document.createElement("canvas").getContext("2d");
      b.canvas.width = w;
      b.canvas.height = h;
      if (idx < this._sceneManager._scenes.length - 1) {
        draw(b, idx + 1);
        b.globalCompositeOperation = "source-over";
      }
      scene.DrawObjects(b, w, h);
      ctx.drawImage(b.canvas, 0, 0);
    };
    const step = (elapsedTime) => {
      for (let scene of this._sceneManager._scenes) {
        scene.Update(elapsedTime * 1e-3);
      }
      this._renderer.Render();
      draw(this._renderer._context);
    };
    this._engine._step = step;
    this._InitSceneEvents();
    this._engine.Start();
    if (this._preload) {
      this._preload();
      this._loader.Load((data) => {
        this._resources = data;
        this._init();
      });
    } else {
      this._resources = new Map();
      this._init();
    }
  }
  get loader() {
    return this._loader;
  }
  get resources() {
    return this._resources;
  }
  _InitControls(layout) {
    const applyStyle = (elem, bg = true) => {
      const color = "rgba(150, 150, 150, 0.6)";
      elem.style.position = "absolute";
      elem.style.border = "2px solid " + color;
      elem.style.color = color;
      elem.style.fontFamily = "Arial";
      elem.style.display = "flex";
      elem.style.alignItems = "center";
      elem.style.justifyContent = "center";
      if (bg)
        elem.style.background = "radial-gradient(circle at center, " + color + " 0, rgba(0, 0, 0, 0.6) 60%)";
    };
    const createButton = (right, bottom, text) => {
      const button = document.createElement("div");
      button.style.width = "46px";
      button.style.height = "46px";
      button.style.right = right - 5 + "px";
      button.style.bottom = bottom + 10 + "px";
      button.textContent = text;
      button.style.borderRadius = "50%";
      button.style.fontSize = "22px";
      applyStyle(button);
      controlsContainer.appendChild(button);
      return button;
    };
    const createSideButton = (side) => {
      const button = document.createElement("div");
      button.style.width = "46px";
      button.style.height = "46px";
      button.style.bottom = 190 + "px";
      button.style.fontSize = "22px";
      if (side == "left") {
        button.style.left = 5 + "px";
        button.textContent = "L";
        button.style.borderRadius = "50% 0 0 50%";
      } else if (side == "right") {
        button.style.right = 5 + "px";
        button.textContent = "R";
        button.style.borderRadius = "0 50% 50% 0";
      }
      applyStyle(button);
      controlsContainer.appendChild(button);
      return button;
    };
    const createActionButton = (text) => {
      const button = document.createElement("div");
      button.style.width = "50px";
      button.style.height = "22px";
      if (text == "Start") {
        button.style.left = "calc(50% + " + 3 + "px)";
      } else if (text == "Select") {
        button.style.right = "calc(50% + " + 3 + "px)";
      }
      button.style.bottom = 20 + "px";
      button.textContent = text;
      button.style.borderRadius = "12px";
      button.style.fontSize = "12px";
      button.style.fontWeight = "bolder";
      applyStyle(button);
      controlsContainer.appendChild(button);
      return button;
    };
    const controlsContainer = document.createElement("div");
    controlsContainer.style.width = "100%";
    controlsContainer.style.height = "100%";
    controlsContainer.style.zIndex = "999";
    controlsContainer.style.position = "absolute";
    const controlsMap = {};
    const joystick = document.createElement("div");
    joystick.style.width = "120px";
    joystick.style.height = "120px";
    joystick.style.left = "10px";
    joystick.style.bottom = "50px";
    joystick.style.borderRadius = "50%";
    joystick.style.overflow = "hidden";
    applyStyle(joystick);
    controlsContainer.appendChild(joystick);
    for (let i2 = 0; i2 < 4; ++i2) {
      const box = document.createElement("div");
      box.style.width = "120px";
      box.style.height = "120px";
      box.style.left = -75 + 150 * (i2 % 2) + "px";
      box.style.top = -75 + 150 * Math.floor(i2 / 2) + "px";
      applyStyle(box, false);
      joystick.appendChild(box);
    }
    controlsMap.joystick = joystick;
    controlsMap.A = createButton(10, 63, "A");
    controlsMap.B = createButton(63, 10, "B");
    controlsMap.X = createButton(63, 116, "X");
    controlsMap.Y = createButton(116, 63, "Y");
    controlsMap.SL = createSideButton("left");
    controlsMap.SR = createSideButton("right");
    controlsMap.select = createActionButton("Select", -20);
    controlsMap.start = createActionButton("Start", 20);
    document.body.appendChild(controlsContainer);
    const getJoystickDirection = (e) => {
      const directions = {
        left: new Vector(-1, 0),
        right: new Vector(1, 0),
        top: new Vector(0, -1),
        bottom: new Vector(0, 1)
      };
      const target = joystick.getBoundingClientRect();
      const x = e.changedTouches[0].pageX - (target.left + target.width / 2);
      const y = e.changedTouches[0].pageY - (target.top + target.height / 2);
      const pos = new Vector(x, y);
      if (pos.Mag() < 20)
        return [];
      const n = pos.Clone().Unit();
      const res = [];
      if (Vector.Dot(n, directions.left) >= 0.5) {
        res.push("left");
      }
      if (Vector.Dot(n, directions.right) >= 0.5) {
        res.push("right");
      }
      if (Vector.Dot(n, directions.top) >= 0.5) {
        res.push("up");
      }
      if (Vector.Dot(n, directions.bottom) >= 0.5) {
        res.push("down");
      }
      return res;
    };
    const handleJoystick = (ev, dirs, keys) => {
      for (let dir of dirs) {
        this._HandleSceneEvent(ev, {
          key: keys[dir]
        });
      }
    };
    for (let attr in controlsMap) {
      const elem = controlsMap[attr];
      const key = layout[attr];
      if (attr == "joystick") {
        elem.addEventListener("touchstart", (e) => {
          const dirs = getJoystickDirection(e);
          handleJoystick("keydown", dirs, key);
        });
        elem.addEventListener("touchmove", (e) => {
          handleJoystick("keyup", ["left", "right", "up", "down"], key);
          const dirs = getJoystickDirection(e);
          handleJoystick("keydown", dirs, key);
        });
        elem.addEventListener("touchend", (e) => {
          const dirs = getJoystickDirection(e);
          handleJoystick("keyup", ["left", "right", "up", "down"], key);
        });
        continue;
      }
      elem.addEventListener("touchdown", () => {
        this._HandleSceneEvent("keydown", {
          key
        });
      });
      elem.addEventListener("touchend", () => {
        this._HandleSceneEvent("keyup", {
          key
        });
      });
    }
  }
  _InitSceneEvents() {
    const isTouchDevice = "ontouchstart" in document;
    const cnv = this._renderer._canvas;
    if (isTouchDevice) {
      cnv.addEventListener("touchstart", (e) => this._HandleTouchEvent(e));
      cnv.addEventListener("touchmove", (e) => this._HandleTouchEvent(e));
      cnv.addEventListener("touchend", (e) => this._HandleTouchEvent(e));
    } else {
      cnv.addEventListener("mousedown", (e) => this._HandleMouseEvent(e));
      cnv.addEventListener("mousemove", (e) => this._HandleMouseEvent(e));
      cnv.addEventListener("mouseup", (e) => this._HandleMouseEvent(e));
    }
    addEventListener("keydown", (e) => this._HandleKeyEvent(e));
    addEventListener("keyup", (e) => this._HandleKeyEvent(e));
  }
  _HandleKeyEvent(e) {
    this._HandleSceneEvent(e.type, {
      key: e.key
    });
  }
  _HandleTouchEvent(e) {
    const touchToMouseType = {
      "touchstart": "mousedown",
      "touchmove": "mousemove",
      "touchend": "mouseup"
    };
    this._HandleSceneEvent(touchToMouseType[e.type], {
      x: e.changedTouches[0].pageX,
      y: e.changedTouches[0].pageY
    });
  }
  _HandleMouseEvent(e) {
    this._HandleSceneEvent(e.type, {
      x: e.pageX,
      y: e.pageY
    });
  }
  _HandleSceneEvent(type, params0) {
    for (let scene of this._sceneManager._scenes) {
      const params = Object.assign({}, params0);
      if (type.startsWith("mouse")) {
        const coords = this._renderer.DisplayToSceneCoords(scene, params.x, params.y);
        params.x = coords.x;
        params.y = coords.y;
      }
      if (scene._On(type, params)) {
        break;
      }
    }
  }
  CreateSection(id) {
    const section = document.createElement("div");
    section.id = id;
    section.style.position = "absolute";
    section.style.left = "0";
    section.style.top = "0";
    section.style.width = "100%";
    section.style.height = "100%";
    section.style.display = "none";
    this._renderer._container.appendChild(section);
    return section;
  }
  GetSection(id) {
    return document.getElementById(id);
  }
  ShowSection(id) {
    this.GetSection(id).style.display = "block";
  }
  HideSection(id) {
    this.GetSection(id).style.display = "none";
  }
  CreateScene(n, params = {}) {
    const scene = new Scene(params);
    scene.resources = this._resources;
    this._sceneManager.Add(scene, n, params.zIndex || 0);
    return scene;
  }
  PlayScene(n) {
    return this._sceneManager.Play(n);
  }
};

// src/core/drawable/drawable.js
var drawable_exports = {};
__export(drawable_exports, {
  Circle: () => Circle,
  Drawable: () => Drawable,
  Image: () => Image2,
  Line: () => Line,
  Poly: () => Poly2,
  Polygon: () => Polygon,
  Rect: () => Rect,
  Sprite: () => Sprite,
  Text: () => Text
});
var Drawable = class extends Component {
  constructor(params = {}) {
    super();
    this._type = "drawable";
    this._width = ParamParser.ParseValue(params.width, 0);
    this._height = ParamParser.ParseValue(params.height, 0);
    this._vertices = [];
    this._zIndex = ParamParser.ParseValue(params.zIndex, 0);
    this.flip = ParamParser.ParseObject(params.flip, { x: false, y: false });
    this._scale = ParamParser.ParseObject(params.scale, { x: 1, y: 1 });
    this.opacity = ParamParser.ParseValue(params.opacity, 1);
    this._angle = 0;
    this._fillStyle = ParamParser.ParseValue(params.fillStyle, "black");
    this._strokeStyle = ParamParser.ParseValue(params.strokeStyle, "black");
    this.strokeWidth = ParamParser.ParseValue(params.strokeWidth, 0);
    this.mode = ParamParser.ParseValue(params.mode, "source-over");
    this._offset = new Vector();
    this._shaking = null;
  }
  get zIndex() {
    return this._zIndex;
  }
  set zIndex(val) {
    this._zIndex = val;
    if (this.scene) {
      this.scene._RemoveDrawable(this);
      this.scene._AddDrawable(this);
    }
  }
  get width() {
    return this._width;
  }
  get height() {
    return this._height;
  }
  set width(num) {
    this._width = num;
    this._ComputeVertices();
  }
  set height(num) {
    this._height = num;
    this._ComputeVertices();
  }
  set angle(num) {
    this._angle = num;
  }
  get angle() {
    return this._angle;
  }
  get scale() {
    return this._scale;
  }
  set scale(num) {
    this._scale = num;
  }
  get fillStyle() {
    return this._fillStyle;
  }
  set fillStyle(col) {
    this._fillStyle = col;
  }
  get strokeStyle() {
    return this._strokeStyle;
  }
  set strokeStyle(col) {
    this._strokeStyle = col;
  }
  get boundingBox() {
    const verts = this._vertices;
    let maxDist = 0;
    let idx = 0;
    for (let i2 = 0; i2 < verts.length; ++i2) {
      const v = verts[i2];
      const dist = v.Mag();
      if (dist > maxDist) {
        maxDist = dist;
        idx = i2;
      }
    }
    const d = maxDist * 2;
    return {
      width: d,
      height: d,
      x: this.position.x,
      y: this.position.y
    };
  }
  get position0() {
    return this.position;
  }
  Shake(range, dur, freq, angle) {
    this._shaking = {
      counter: 0,
      freq,
      angle,
      dur,
      range
    };
  }
  StopShaking() {
    this._shaking = null;
    this._offset = new Vector();
  }
  InitComponent() {
    this._ComputeVertices();
  }
  GetVertices() {
    const arr = [
      new Vector(-this._width / 2, -this._height / 2),
      new Vector(this._width / 2, -this._height / 2),
      new Vector(-this._width / 2, this._height / 2),
      new Vector(this._width / 2, this._height / 2)
    ];
    return arr;
  }
  _ComputeVertices() {
    this._vertices = this.GetVertices();
  }
  SetSize(w, h) {
    this._width = w;
    this._height = h;
  }
  Draw(_) {
  }
  Draw0(ctx) {
    ctx.save();
    ctx.translate(-this._offset.x, -this._offset.y);
    ctx.save();
    ctx.globalAlpha = this.opacity;
    ctx.translate(this.position0.x, this.position0.y);
    ctx.scale(this.flip.x ? -this.scale : this.scale, this.flip.y ? -this.scale : this.scale);
    ctx.rotate(this.angle);
    ctx.fillStyle = StyleParser.ParseColor(ctx, this.fillStyle);
    ctx.strokeStyle = StyleParser.ParseColor(ctx, this.strokeStyle);
    ctx.lineWidth = this.strokeWidth;
    this.Draw(ctx);
    ctx.restore();
    ctx.restore();
  }
  Update(elapsedTimeS) {
    if (this._shaking) {
      const anim = this._shaking;
      const count = Math.floor(anim.freq / 1e3 * anim.dur);
      anim.counter += elapsedTimeS * 1e3;
      const progress = Math.min(anim.counter / anim.dur, 1);
      this._offset.Copy(new Vector(Math.sin(progress * Math.PI * 2 * count) * anim.range, 0).Rotate(anim.angle));
      if (progress == 1) {
        this.StopShaking();
      }
    }
  }
};
var Text = class extends Drawable {
  constructor(params) {
    super(params);
    this._text = params.text;
    this._lines = this._text.split(/\n/);
    this._padding = ParamParser.ParseValue(params.padding, 0);
    this._align = ParamParser.ParseValue(params.align, "center");
    this._fontSize = ParamParser.ParseValue(this._params.fontSize, 16);
    this._fontFamily = ParamParser.ParseValue(this._params.fontFamily, "Arial");
    this._fontStyle = ParamParser.ParseValue(this._params.fontStyle, "normal");
    this._ComputeDimensions();
  }
  get linesCount() {
    return this._lines.length;
  }
  get lineHeight() {
    return this._fontSize + this._padding * 2;
  }
  get text() {
    return this._text;
  }
  set text(val) {
    this._text = val;
    this._ComputeDimensions();
  }
  get fontSize() {
    return this._fontSize;
  }
  set fontSize(val) {
    this._fontSize = val;
    this._ComputeDimensions();
  }
  get fontFamily() {
    return this._fontFamily;
  }
  set fontFamily(val) {
    this._fontFamily = val;
    this._ComputeDimensions();
  }
  get padding() {
    return this._padding;
  }
  set padding(val) {
    this._padding = val;
    this._ComputeDimensions();
  }
  get align() {
    return this._align;
  }
  set align(s) {
    this._align = s;
    this._ComputeDimensions();
  }
  _ComputeDimensions() {
    this._height = this.lineHeight * this.linesCount;
    let maxWidth = 0;
    const ctx = document.createElement("canvas").getContext("2d");
    ctx.font = `${this._fontStyle} ${this._fontSize}px '${this._fontFamily}'`;
    for (let line of this._lines) {
      const lineWidth = ctx.measureText(line).width;
      if (lineWidth > maxWidth) {
        maxWidth = lineWidth;
      }
    }
    this._width = maxWidth + this._padding * 2;
  }
  Draw(ctx) {
    let offsetX = this._align == "left" ? -this._width / 2 : this._align == "right" ? this._width / 2 : 0;
    ctx.font = `${this._fontStyle} ${this._fontSize}px '${this._fontFamily}'`;
    ctx.textAlign = this._align;
    ctx.textBaseline = "middle";
    ctx.beginPath();
    for (let i2 = 0; i2 < this.linesCount; ++i2) {
      ctx.fillText(this._lines[i2], offsetX + this._padding, this.lineHeight * i2 - (this.linesCount - 1) / 2 * this.lineHeight);
    }
  }
};
var Image2 = class extends Drawable {
  constructor(params) {
    super(params);
    this._image = params.image;
    this._frameWidth = ParamParser.ParseValue(params.frameWidth, this._image.width);
    this._frameHeight = ParamParser.ParseValue(params.frameHeight, this._image.height);
    this._framePos = ParamParser.ParseObject(params.framePosition, { x: 0, y: 0 });
  }
  Draw(ctx) {
    ctx.drawImage(this._image, this._framePos.x * this._frameWidth, this._framePos.y * this._frameHeight, this._frameWidth, this._frameHeight, -this._width / 2, -this._height / 2, this._width, this._height);
  }
};
var Rect = class extends Drawable {
  constructor(params) {
    super(params);
  }
  Draw(ctx) {
    ctx.beginPath();
    ctx.rect(-this._width / 2, -this._height / 2, this._width, this._height);
    ctx.fill();
    if (this.strokeWidth > 0)
      ctx.stroke();
  }
};
var Circle = class extends Drawable {
  constructor(params) {
    super(params);
    this._radius = params.radius;
  }
  get radius() {
    return this._radius;
  }
  get boundingBox() {
    return {
      width: this._radius * 2,
      height: this._radius * 2,
      x: this.position.x,
      y: this.position.y
    };
  }
  set radius(val) {
    this._radius = val;
  }
  Draw(ctx) {
    ctx.beginPath();
    ctx.arc(0, 0, this._radius, 0, 2 * Math.PI);
    ctx.fill();
    if (this.strokeWidth > 0)
      ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(this.radius, 0);
    ctx.stroke();
  }
};
var Poly2 = class extends Drawable {
  constructor(params) {
    super(params);
    this._points = ParamParser.ParseValue(params.points, []);
  }
  GetVertices() {
    return this._points.map((v) => new Vector(v[0], v[1]));
  }
  Draw(ctx) {
    ctx.beginPath();
    for (let i2 = 0; i2 < this._vertices.length; ++i2) {
      const v = this._vertices[i2];
      if (i2 == 0)
        ctx.moveTo(v.x, v.y);
      else
        ctx.lineTo(v.x, v.y);
    }
    ctx.closePath();
    ctx.fill();
    if (this.strokeWidth > 0)
      ctx.stroke();
  }
};
var Polygon = class extends Poly2 {
  constructor(params) {
    super(params);
    this._radius = params.radius;
    this.sides = params.sides;
    this._InitPoints();
  }
  _InitPoints() {
    const points = [];
    for (let i2 = 0; i2 < this.sides; ++i2) {
      const angle = Math.PI * 2 / this.sides * i2;
      points.push([Math.cos(angle) * this.radius, Math.sin(angle) * this.radius]);
    }
    this._points = points;
  }
  get radius() {
    return this._radius;
  }
  set radius(num) {
    this._radius = num;
  }
};
var Sprite = class extends Drawable {
  constructor(params) {
    super(params);
    this._image = params.image;
    this._frameWidth = ParamParser.ParseValue(params.frameWidth, this._image.width);
    this._frameHeight = ParamParser.ParseValue(params.frameHeight, this._image.height);
    this._anims = new Map();
    this._currentAnim = null;
    this._paused = true;
    this._framePos = { x: 0, y: 0 };
  }
  AddAnim(n, frames) {
    this._anims.set(n, frames);
  }
  PlayAnim(n, rate, repeat, OnEnd) {
    if (this.currentAnim == n) {
      return;
    }
    this._paused = false;
    const currentAnim = {
      name: n,
      rate,
      repeat,
      OnEnd,
      frame: 0,
      counter: 0
    };
    this._currentAnim = currentAnim;
    this._framePos = this._anims[currentAnim.name][currentAnim.frame];
  }
  Reset() {
    if (this._currentAnim) {
      this._currentAnim.frame = 0;
      this._currentAnim.counter = 0;
    }
  }
  Pause() {
    this._paused = true;
  }
  Resume() {
    if (this._currentAnim) {
      this._paused = false;
    }
  }
  Update(timeElapsedS) {
    super.Update(timeElapsedS);
    if (this._paused) {
      return;
    }
    const currentAnim = this._currentAnim;
    const frames = this._anims.get(currentAnim.name);
    currentAnim.counter += timeElapsedS * 1e3;
    if (currentAnim.counter >= currentAnim.rate) {
      currentAnim.counter = 0;
      ++currentAnim.frame;
      if (currentAnim.frame >= frames.length) {
        currentAnim.frame = 0;
        if (currentAnim.OnEnd) {
          currentAnim.OnEnd();
        }
        if (!currentAnim.repeat) {
          this._currentAnim = null;
          this._paused = true;
        }
      }
      this._framePos = frames[currentAnim.frame];
    }
  }
  get currentAnim() {
    if (this._currentAnim) {
      return this._currentAnim.name;
    }
    return null;
  }
  Draw(ctx) {
    ctx.drawImage(this._image, this._framePos.x * this._frameWidth, this._framePos.y * this._frameHeight, this._frameWidth, this._frameHeight, -this._width / 2, -this._height / 2, this._width, this._height);
  }
};
var Line = class extends Drawable {
  constructor(params) {
    super(params);
    this.length = params.length;
  }
  get boundingBox() {
    return {
      width: this.length * 2,
      height: this.length * 2,
      x: this.position.x,
      y: this.position.y
    };
  }
  Draw(ctx) {
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(this.length, 0);
    ctx.stroke();
  }
};

// src/core/particle.js
var Emitter = class extends Component {
  constructor(params) {
    super();
    this._particles = [];
    this._options = {
      lifetime: ParamParser.ParseObject(params.lifetime, { min: 1e3, max: 1e3 }),
      friction: ParamParser.ParseValue(params.friction, 0),
      angleVariance: ParamParser.ParseValue(params.angleVariance, 0),
      angle: ParamParser.ParseObject(params.angle, { min: 0, max: 0 }),
      speed: ParamParser.ParseObject(params.speed, { min: 0, max: 0 }),
      acceleration: params.acceleration || new Vector(),
      scale: ParamParser.ParseObject(params.scale, { from: 1, to: 0 }),
      opacity: ParamParser.ParseObject(params.opacity, { from: 1, to: 0 }),
      rotationSpeed: ParamParser.ParseValue(params.rotationSpeed, 0)
    };
    this._emitting = null;
  }
  _CreateParticle() {
    const particle2 = this.scene.CreateEntity();
    particle2.groupList.add("particle");
    particle2.position.Copy(this.position);
    const particleType = math.choice(this._particles);
    particle2.AddComponent(new particleType[0](particleType[1]), "Sprite");
    particle2.AddComponent(new ParticleController(this._options));
  }
  AddParticle(type, params) {
    this._particles.push([type, params]);
  }
  Emit(count, repeat = false, delay = 0) {
    if (repeat) {
      this._emitting = {
        count,
        counter: delay,
        delay
      };
    } else {
      for (let i2 = 0; i2 < count; ++i2) {
        this._CreateParticle();
      }
    }
  }
  Update(elapsedTimeS) {
    if (this._emitting) {
      const emitting = this._emitting;
      emitting.counter += elapsedTimeS * 1e3;
      if (emitting.counter >= emitting.delay) {
        emitting.counter = 0;
        this.Emit(emitting.count);
      }
    }
  }
};
var ParticleController = class extends Component {
  constructor(params) {
    super();
    this._friction = params.friction || 0;
    this._lifetime = this._InitMinMax(params.lifetime);
    this._angleVariance = params.angleVariance || 0;
    this._acc = params.acceleration || new Vector();
    this._counter = 0;
    this._scale = this._InitRange(params.scale);
    this._opacity = this._InitRange(params.opacity);
    this._vel = new Vector(this._InitMinMax(params.speed), 0).Rotate(this._InitMinMax(params.angle));
    this._rotationSpeed = params.rotationSpeed || 0;
  }
  _InitMinMax(param) {
    return math.rand(param.min, param.max);
  }
  _InitRange(param) {
    if (!param) {
      return null;
    } else {
      return { from: param.from == void 0 ? 1 : param.from, to: param.to };
    }
  }
  Update(elapsedTimeS) {
    this._counter += elapsedTimeS * 1e3;
    if (this._counter >= this._lifetime) {
      this.scene.RemoveEntity(this.parent);
      return;
    }
    this._vel.Add(this._acc.Mult(elapsedTimeS));
    const decceleration = 60;
    const frameDecceleration = new Vector(this._vel.x * decceleration * this._friction, this._vel.y * decceleration * this._friction);
    this._vel.Sub(frameDecceleration.Mult(elapsedTimeS));
    this._vel.Rotate(math.rand(-this._angleVariance, this._angleVariance) * elapsedTimeS);
    this.position.Add(this._vel.Clone().Mult(elapsedTimeS));
    const sprite = this.GetComponent("Sprite");
    const progress = Math.min(this._counter / this._lifetime, 1);
    if (this._scale) {
      sprite.scale = math.lerp(progress, this._scale.from, this._scale.to);
    }
    if (this._opacity) {
      sprite.opacity = math.lerp(progress, this._opacity.from, this._opacity.to);
    }
    this._rotationSpeed -= this._rotationSpeed * decceleration * this._friction;
    sprite.angle += this._rotationSpeed * elapsedTimeS;
  }
};
var particle = {
  Emitter
};

// src/Lancelot.js
var __name = "Lancelot";
var __export2 = {
  Vector,
  Game,
  Component,
  particle,
  drawable: drawable_exports,
  physics: physics_exports,
  math,
  light: light_exports
};
if (typeof module === "object" && typeof module.exports === "object") {
  module.exports = __export2;
} else if (typeof define === "function" && define.amd) {
  define(__name, [], __export2);
} else {
  let global = typeof globalThis !== "undefined" ? globalThis : self;
  global[__name] = __export2;
}
var Lancelot_default = __export2;
export {
  Lancelot_default as default
};
