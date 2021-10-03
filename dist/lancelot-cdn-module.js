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
    lerp(x, a, b2) {
      return a + (b2 - a) * x;
    },
    clamp(x, a, b2) {
      return Math.min(Math.max(x, a), b2);
    },
    in_range(x, a, b2) {
      return x >= a && x <= b2;
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
  }
  get playing() {
    return this._current ? !this._current.paused : false;
  }
  AddAudio(n, audio, loop = false) {
    audio.loop = loop;
    audio.volume = this._volume;
    this._audioMap.set(n, audio);
  }
  Play(n, fromStart = false) {
    if (this._current) {
      this._current.pause();
    }
    const audio = this._audioMap.get(n);
    if (audio) {
      this._current = audio;
      if (fromStart) {
        this._current.currentTime = 0;
      }
      this._current.play();
    }
  }
  PlayClone(n) {
    const audio = this._audioMap.get(n);
    if (audio) {
      const audioClone = audio.cloneNode(true);
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
    this._timeouts.push({ action: f, dur, counter: 0 });
  }
  Update(elapsedTime) {
    for (let i = 0; i < this._timeouts.length; ++i) {
      const timeout = this._timeouts[i];
      if ((timeout.counter += elapsedTime) >= timeout.dur) {
        timeout.action();
        this._timeouts.splice(i--, 1);
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

// src/core/utils/vector.js
var Vector2 = class {
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
    return new Vector2(this.x, this.y);
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
    return Math.atan2(this.y, this_x);
  }
  Rotate(angle) {
    const sin = Math.sin(angle);
    const cos = Math.cos(angle);
    const x = this.x * cos - this.y * sin;
    const y = this.x * sin + this.y * cos;
    this.Set(x, y);
    return this;
  }
  static Dot(v1, v2) {
    return v1.x * v2.x + v1.y * v2.y;
  }
  static Dist(v1, v2) {
    return v1.Clone().Sub(v2).Mag();
  }
  static AngleBetween(v1, v2) {
    const z1 = v1.Mag();
    const z2 = v2.Mag();
    if (z1 === 0 || z2 === 0) {
      return 0;
    }
    return Math.acos(Vector2.Dot(v1, v2) / (z1 * z2));
  }
};
var PositionVector = class extends Vector2 {
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
  constructor(params2) {
    this._width = params2.width;
    this._height = params2.height;
    this._aspect = this._width / this._height;
    this._scale = 1;
    this.background = params2.background || "black";
    this._InitContainer();
    this._InitCanvas();
    this._OnResize();
    window.addEventListener("resize", () => this._OnResize());
  }
  get dimension() {
    return this._canvas.getBoundingClientRect();
  }
  _InitContainer() {
    const body = document.body;
    body.style.userSelect = "none";
    body.style.touchAction = "none";
    body.style.position = "fixed";
    body.style.width = "100%";
    body.style.height = "100%";
    body.style.overflow = "hidden";
    body.style.margin = "0";
    body.style.padding = "0";
    const con = this._container = document.createElement("div");
    con.style.width = this._width + "px";
    con.style.height = this._height + "px";
    con.style.position = "absolute";
    con.style.left = "50%";
    con.style.top = "50%";
    con.style.transformOrigin = "center";
    body.appendChild(con);
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
    this._container.appendChild(cnv);
  }
  _OnResize() {
    const [width, height] = [document.body.clientWidth, document.body.clientHeight];
    if (width / height > this._aspect) {
      this._scale = height / this._height;
    } else {
      this._scale = width / this._width;
    }
    this._container.style.transform = "translate(-50%, -50%) scale(" + this._scale + ")";
    this._context.imageSmoothingEnabled = false;
  }
  Render(scene) {
    const ctx = this._context;
    ctx.beginPath();
    ctx.fillStyle = this.background;
    ctx.fillRect(0, 0, this._width, this._height);
    if (!scene)
      return;
    const cam = scene.camera;
    ctx.save();
    ctx.translate(-cam.position.x * cam.scale + this._width / 2, -cam.position.y * cam.scale + this._height / 2);
    ctx.scale(cam.scale, cam.scale);
    for (let elem of scene._drawable) {
      const boundingBox = elem.boundingBox;
      const pos = new Vector2(boundingBox.x, boundingBox.y);
      pos.Sub(cam.position);
      pos.Mult(cam.scale);
      const [width, height] = [boundingBox.width, boundingBox.height].map((_) => _ * cam.scale);
      if (pos.x + width / 2 < -this._width / 2 || pos.x - width / 2 > this._width / 2 || pos.y + height / 2 < -this._height / 2 || pos.y - height / 2 > this._height / 2) {
        continue;
      }
      elem.Draw(ctx);
    }
    ctx.restore();
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
    this._currentScene = null;
    this._scenes = new Map();
  }
  get currentScene() {
    return this._currentScene;
  }
  set currentScene(n) {
    this._currentScene = this._scenes.get(n) || null;
  }
  Add(s, n) {
    this._scenes.set(n, s);
  }
  Play(n) {
    this.currentScene = n;
    if (this._currentScene) {
      this._currentScene.Play();
    }
    return this._currentScene;
  }
};

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
    const i = this._entities.indexOf(e);
    if (i < 0) {
      return;
    }
    this._entities.splice(i, 1);
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
    const i = this._attached.indexOf(e);
    if (i != -1) {
      this._attached.splice(i, 1);
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
    this._vel = new Vector2();
    this._scaling = null;
    this._shaking = null;
    this._offset = new Vector2();
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
    this._offset = new Vector2();
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
      this._offset.Copy(new Vector2(Math.sin(progress * Math.PI * 2 * anim.count) * anim.range, 0).Rotate(anim.angle));
      this.position.Add(this._offset);
      if (progress == 1) {
        this.StopShaking();
      }
    }
  }
};

// src/core/component.js
var Component = class {
  constructor() {
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

// src/core/interactive.js
var Interactive = class extends Component {
  constructor(params2) {
    super();
    this._capture = params2.capture === void 0 ? false : params2.capture;
    this._eventHandlers = new Map();
  }
  AddEventHandler(type, handler) {
    if (!this._eventHandlers.has(type)) {
      this._eventHandlers.set(type, []);
    }
    const handlers = this._eventHandlers.get(type);
    handlers.push(handler);
  }
  RemoveEventHandler(type, handler) {
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
    }
  }
  GetComponent(n) {
    return this._components.get(n);
  }
  FindEntity(n) {
    return this._parent.Get(n);
  }
};

// src/core/scene.js
var Scene = class {
  constructor(params2) {
    this._bounds = params2.bounds || [[-1e3, -1e3], [1e3, 1e3]];
    this._cellDimensions = params2.cellDimensions || [100, 100];
    this._relaxationCount = params2.relaxationCount || 5;
    this.paused = true;
    this.speed = 1;
    this.timeout = new TimeoutHandler();
    this._bodies = [];
    this._drawable = [];
    this._interactiveEntities = [];
    this._eventHandlers = new Map();
    this._entityManager = new EntityManager();
    this._spatialGrid = new SpatialHashGrid(this._bounds, [Math.floor((this._bounds[1][0] - this._bounds[0][0]) / this._cellDimensions[0]), Math.floor((this._bounds[1][1] - this._bounds[0][1]) / this._cellDimensions[1])]);
    this._camera = new Camera();
  }
  get camera() {
    return this._camera;
  }
  CreateEntity(n) {
    const e = new Entity();
    this.AddEntity(e, n);
    return e;
  }
  AddEventHandler(type, handler) {
    if (!this._eventHandlers.has(type)) {
      this._eventHandlers.set(type, []);
    }
    const handlers = this._eventHandlers.get(type);
    handlers.push(handler);
  }
  RemoveEventHandler(type, handler) {
    if (!this._eventHandlers.has(type)) {
      return;
    }
    const handlers = this._eventHandlers.get(type);
    const idx = handlers.indexOf(handler);
    if (idx > -1) {
      handlers.splice(idx, 1);
    }
  }
  SetInteractive(entity, params2 = {}) {
    this._interactiveEntities.push(entity);
    const interactive = new Interactive(params2);
    entity.AddComponent(interactive);
    entity.interactive = interactive;
  }
  _On(type, event) {
    if (this._eventHandlers.has(type)) {
      const handlers = this._eventHandlers.get(type);
      for (let handler of handlers) {
        handler(event);
      }
    }
    if (type == "mousedown") {
      const entities = this._spatialGrid.FindNear([event.x, event.y], [0, 0]).map((c) => c.entity);
      for (let e of entities) {
        if (!e.interactive) {
          continue;
        }
        if (e.body.Contains(new Vector(event.x, event.y))) {
          e.interactive._On(type, event);
          e.interactive._id = event.id;
          if (e.interactive._capture) {
            break;
          }
        }
      }
    } else if (type == "mousemove" || type == "mouseup") {
      for (let e of this._interactiveEntities) {
        if (e.interactive._id == event.id) {
          e.interactive._On(type, event);
          if (type == "mouseup") {
            e.interactive._id = -1;
          }
        }
      }
    }
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
        this._RemoveBody(e, b);
      }
    });
  }
  _AddDrawable(c) {
    this._drawable.push(c);
    for (let i = this._drawable.length - 1; i > 0; --i) {
      if (c._zIndex >= this._drawable[i - 1]._zIndex) {
        break;
      }
      [this._drawable[i], this._drawable[i - 1]] = [this._drawable[i - 1], this._drawable[i]];
    }
  }
  _RemoveDrawable(c) {
    const i = this._drawable.indexOf(c);
    if (i != -1) {
      this._drawable.splice(i, 1);
    }
  }
  _AddBody(e, b2) {
    e.body = b2;
    const gridController = new SpatialGridController({
      grid: this._spatialGrid,
      width: b2.width,
      height: b2.height
    });
    e.AddComponent(gridController);
    this._bodies.push(b2);
  }
  _RemoveBody(e, b2) {
    const gridController = e.GetComponent("SpatialGridController");
    if (gridController) {
      this._spatialGrid.RemoveClient(gridController._client);
    }
    const i = this._bodies.indexOf(b2);
    if (i != -1) {
      this._bodies.splice(i, 1);
    }
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
    for (let i = 0; i < this._relaxationCount; ++i) {
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
    elapsedTimeS *= this.speed;
    this._entityManager.Update(elapsedTimeS);
    this._PhysicsUpdate(elapsedTimeS);
    this._camera.Update(elapsedTimeS);
  }
  Play() {
    this.paused = false;
  }
  Pause() {
    this.paused = true;
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
    this._toLoad.push({
      name: n,
      path: this._path + p,
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
  constructor(params2) {
    this._width = params2.width;
    this._height = params2.height;
    this._preload = params2.preload == void 0 ? null : params2.preload.bind(this);
    this._init = params2.init.bind(this);
    this._resources = null;
    this._loader = new Loader();
    this._renderer = new Renderer({
      width: this._width,
      height: this._height,
      background: params2.background
    });
    this._engine = new Engine();
    this._sceneManager = new SceneManager();
    this.timeout = this._engine.timeout;
    this.audio = (() => {
      const sections = new Map();
      const AddSection = (n) => {
        sections.set(n, new AudioSection());
      };
      AddSection("music");
      AddSection("effects");
      const AddAudio = (sectionName, audioName, loop = false) => {
        const section = sections.get(sectionName);
        section.AddAudio(audioName, this._resources.get(audioName), loop);
      };
      const AddMusic = (audioName, loop = false) => {
        AddAudio("music", audioName, loop);
      };
      const AddEffect = (audioName, loop = false) => {
        AddAudio("effects", audioName, loop);
      };
      return {
        get music() {
          return sections.get("music");
        },
        get effects() {
          return sections.get("effects");
        },
        AddMusic,
        AddEffect
      };
    })();
    const step = (elapsedTime) => {
      const scene = this._sceneManager.currentScene;
      if (scene) {
        scene.Update(elapsedTime * 1e-3);
      }
      this._renderer.Render(scene);
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
  get background() {
    return this._renderer.background;
  }
  set background(col) {
    this._renderer.background = col;
  }
  get loader() {
    return this._loader;
  }
  get resources() {
    return this._resources;
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
  }
  _HandleTouchEvent(e) {
    const touchToMouseType = {
      "touchstart": "mousedown",
      "touchmove": "mousemove",
      "touchend": "mouseup"
    };
    this._HandleSceneEvent(touchToMouseType[e.type], e.changedTouches[0].pageX, e.changedTouches[0].pageY);
  }
  _HandleMouseEvent(e) {
    this._HandleSceneEvent(e.type, e.pageX, e.pageY);
  }
  _HandleSceneEvent(type, x, y) {
    const scene = this._sceneManager.currentScene;
    if (scene) {
      const coords = this._renderer.DisplayToSceneCoords(scene, x, y);
      scene._On(type, { x: coords.x, y: coords.y, id: 0, type });
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
  CreateScene(n, params2 = {}) {
    const scene = new Scene(params2);
    this._sceneManager.Add(scene, n);
    return scene;
  }
  PlayScene(n) {
    return this._sceneManager.Play(n);
  }
  PauseScene() {
    const scene = this._sceneManager.currentScene;
    if (scene) {
      scene.paused ? scene.Play() : scene.Pause();
    }
  }
};

// src/core/drawable/drawable.js
var drawable_exports = {};
__export(drawable_exports, {
  Circle: () => Circle,
  Drawable: () => Drawable,
  Picture: () => Picture,
  Polygon: () => Polygon,
  Rect: () => Rect,
  Sprite: () => Sprite,
  Text: () => Text
});
var Drawable = class extends Component {
  constructor(params2) {
    super();
    this._type = "drawable";
    this._params = params2;
    this._width = this._params.width || 0;
    this._height = this._params.height || 0;
    this._vertices = [];
    this._zIndex = this._params.zIndex || 0;
    this.flip = {
      x: this._params.flipX || false,
      y: this._params.flipY || false
    };
    this._scale = params2.scale || 1;
    this._rotationCount = this._params.rotationCount || 0;
    this.opacity = this._params.opacity !== void 0 ? this._params.opacity : 1;
    this.filter = this._params.filter || "";
    this._angle = this._params.angle || this._rotationCount * Math.PI / 2 || 0;
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
  get rotationCount() {
    return this._rotationCount;
  }
  set rotationCount(num) {
    this._rotationCount = num;
    this.angle = this._rotationCount * Math.PI / 2;
  }
  get scale() {
    return this._scale;
  }
  set scale(num) {
    this._scale = num;
  }
  get boundingBox() {
    const vertices = this._vertices;
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (let v of vertices) {
      if (v.x < minX) {
        minX = v.x;
      } else if (v.x > maxX) {
        maxX = v.x;
      }
      if (v.y < minY) {
        minY = v.y;
      } else if (v.y > maxY) {
        maxY = v.y;
      }
    }
    const width = maxX - minX;
    const height = maxY - minY;
    const centerX = this.position.x + minX + width / 2;
    const centerY = this.position.y + minY + height / 2;
    return { x: centerX, y: centerY, width, height };
  }
  InitComponent() {
    this._ComputeVertices();
  }
  GetVertices() {
    return [
      new Vector2(-this._width / 2, -this._height / 2),
      new Vector2(this._width / 2, -this._height / 2),
      new Vector2(-this._width / 2, this._height / 2),
      new Vector2(this._width / 2, this._height / 2)
    ];
  }
  _ComputeVertices() {
    this._vertices = this.GetVertices();
    for (let i = 0; i < this._vertices.length; ++i) {
      const v = this._vertices[i];
      v.x *= this.flip.x ? -this.scale : this.scale;
      v.y *= this.flip.y ? -this.scale : this.scale;
      v.Rotate(this.angle);
    }
  }
  SetSize(w, h) {
    this._width = w;
    this._height = h;
  }
  Draw(_) {
  }
};
var Text = class extends Drawable {
  constructor(params2) {
    super(params2);
    this._text = this._params.text;
    this._lines = this._text.split(/\n/);
    this._padding = this._params.padding || 0;
    this._align = params2.align || "center";
    this._fontSize = this._params.fontSize || 16;
    this._fontFamily = this._params.fontFamily || "Arial";
    this._color = this._params.color || "black";
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
    ctx.font = `${this._fontSize}px '${this._fontFamily}'`;
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
    ctx.beginPath();
    ctx.save();
    ctx.globalAlpha = this.opacity;
    ctx.translate(this.position.x, this.position.y);
    ctx.scale(this.flip.x ? -this.scale : this.scale, this.flip.y ? -this.scale : this.scale);
    ctx.rotate(this.angle);
    ctx.fillStyle = this._color;
    ctx.font = `${this._fontSize}px '${this._fontFamily}'`;
    ctx.textAlign = this._align;
    ctx.textBaseline = "middle";
    for (let i = 0; i < this.linesCount; ++i) {
      ctx.fillText(this._lines[i], offsetX + this._padding, this.lineHeight * i - (this.linesCount - 1) / 2 * this.lineHeight);
    }
    ctx.restore();
  }
};
var Picture = class extends Drawable {
  constructor(params2) {
    super(params2);
    this._image = this._params.image;
    this._frameWidth = this._params.frameWidth || this._image.width;
    this._frameHeight = this._params.frameHeight || this._image.height;
    this._framePos = {
      x: this._params.posX || 0,
      y: this._params.posY || 0
    };
  }
  Draw(ctx) {
    ctx.save();
    ctx.globalAlpha = this.opacity;
    ctx.translate(this.position.x, this.position.y);
    ctx.scale(this.flip.x ? -this.scale : this.scale, this.flip.y ? -this.scale : this.scale);
    ctx.rotate(this.angle);
    ctx.drawImage(this._image, this._framePos.x * this._frameWidth, this._framePos.y * this._frameHeight, this._frameWidth, this._frameHeight, -this._width / 2, -this._height / 2, this._width, this._height);
    ctx.restore();
  }
};
var Rect = class extends Drawable {
  constructor(params2) {
    super(params2);
    this.background = this._params.background || "black";
    this.borderColor = this._params.borderColor || "black";
    this.borderWidth = this._params.borderWidth || 0;
  }
  Draw(ctx) {
    ctx.save();
    ctx.globalAlpha = this.opacity;
    ctx.filter = this.filter;
    ctx.translate(this.position.x, this.position.y);
    ctx.scale(this.flip.x ? -this.scale : this.scale, this.flip.y ? -this.scale : this.scale);
    ctx.rotate(this.angle);
    ctx.fillStyle = this.background;
    ctx.strokeStyle = this.borderColor;
    ctx.lineWidth = this.borderWidth;
    ctx.beginPath();
    ctx.rect(-this._width / 2, -this._height / 2, this._width, this._height);
    ctx.fill();
    if (this.borderWidth > 0)
      ctx.stroke();
    ctx.restore();
  }
};
var Circle = class extends Drawable {
  constructor(params2) {
    super(params2);
    this._radius = this._params.radius;
    this._width = this._radius * 2;
    this._height = this._radius * 2;
    this.background = this._params.background || "black";
    this.borderColor = this._params.borderColor || "black";
    this.borderWidth = this._params.borderWidth || 0;
  }
  get radius() {
    return this._radius;
  }
  set radius(val) {
    this._radius = val;
    this._width = this._radius * 2;
    this._height = this._radius * 2;
    this._ComputeVertices();
  }
  Draw(ctx) {
    ctx.save();
    ctx.globalAlpha = this.opacity;
    ctx.filter = this.filter;
    ctx.translate(this.position.x, this.position.y);
    ctx.scale(this.flip.x ? -this.scale : this.scale, this.flip.y ? -this.scale : this.scale);
    ctx.fillStyle = this.background;
    ctx.strokeStyle = this.borderColor;
    ctx.lineWidth = this.borderWidth;
    ctx.beginPath();
    ctx.arc(0, 0, this._radius, 0, 2 * Math.PI);
    ctx.fill();
    if (this.borderWidth > 0)
      ctx.stroke();
    ctx.restore();
  }
};
var Polygon = class extends Drawable {
  constructor(params2) {
    super(params2);
    this.background = this._params.background || "black";
    this.borderColor = this._params.borderColor || "black";
    this.borderWidth = this._params.borderWidth || 0;
  }
  GetVertices() {
    return this._params.vertices.map((v) => new Vector2(v[0], v[1]));
  }
  Draw(ctx) {
    ctx.save();
    ctx.globalAlpha = this.opacity;
    ctx.filter = this.filter;
    ctx.translate(this.position.x, this.position.y);
    ctx.scale(this.flip.x ? -this.scale : this.scale, this.flip.y ? -this.scale : this.scale);
    ctx.fillStyle = this.background;
    ctx.strokeStyle = this.borderColor;
    ctx.lineWidth = this.borderWidth;
    ctx.beginPath();
    for (let i = 0; i < this._vertices.length; ++i) {
      const v = this._vertices[i];
      if (i == 0)
        ctx.moveTo(v.x, v.y);
      else
        ctx.lineTo(v.x, v.y);
    }
    ctx.closePath();
    ctx.fill();
    if (this.borderWidth > 0)
      ctx.stroke();
    ctx.restore();
  }
};
var Sprite = class extends Drawable {
  constructor(params2) {
    super(params2);
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
  Update(timeElapsed) {
    if (this._paused) {
      return;
    }
    const currentAnim = this._currentAnim;
    const frames = this._anims.get(currentAnim.name);
    currentAnim.counter += timeElapsed * 1e3;
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
    ctx.save();
    ctx.globalAlpha = this.opacity;
    ctx.translate(this.position.x, this.position.y);
    ctx.scale(this.flip.x ? -this.scale : this.scale, this.flip.y ? -this.scale : this.scale);
    ctx.rotate(this.angle);
    ctx.drawImage(this._params.image, this._framePos.x * this._params.frameWidth, this._framePos.y * this._params.frameHeight, this._params.frameWidth, this._params.frameHeight, -this._width / 2, -this._height / 2, this._width, this._height);
    ctx.restore();
  }
};

// src/core/physics/physics.js
var physics_exports = {};
__markAsModule(physics_exports);

// src/core/particle.js
var Emitter = class extends Component {
  constructor(params2) {
    super();
    this._particles = [];
    this._options = {
      lifetime: params2.lifetime,
      friction: params2.friction || 0,
      angleVariance: params2.angleVariance || 0,
      angle: this._InitMinMax(params2.angle),
      speed: this._InitMinMax(params2.speed),
      acceleration: params2.acceleration || new Vector2(),
      scale: this._InitRange(params2.scale),
      opacity: this._InitRange(params2.opacity)
    };
    this._emitting = null;
  }
  _InitMinMax(param) {
    if (param == void 0) {
      return 0;
    } else if (typeof param == "number") {
      return { min: param, max: param };
    } else {
      return { min: param.min, max: param.max };
    }
  }
  _InitRange(param) {
    if (param == void 0) {
      return null;
    } else {
      return { from: param.from == void 0 ? 1 : param.from, to: param.to };
    }
  }
  _CreateParticle() {
    const particle2 = this.scene.CreateEntity();
    particle2.groupList.add("particle");
    particle2.position.Copy(this.position);
    const particleType = math.choice(this._particles);
    particle2.AddComponent(new particleType[0](particleType[1]), "Sprite");
    particle2.AddComponent(new ParticleController(this._options));
  }
  AddParticle(type, params2) {
    this._particles.push([type, params2]);
  }
  Emit(count, repeat = false, delay = 0) {
    if (repeat) {
      this._emitting = {
        count,
        counter: delay,
        delay
      };
    } else {
      for (let i = 0; i < count; ++i) {
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
  constructor(params2) {
    super();
    this._friction = params2.friction || 0;
    this._lifetime = params2.lifetime;
    this._angleVariance = params2.angleVariance || 0;
    this._acc = params2.acceleration || new Vector2();
    this._counter = 0;
    this._scale = this._InitRange(params2.scale);
    this._opacity = this._InitRange(params2.opacity);
    this._vel = new Vector2(this._InitMinMax(params2.speed), 0).Rotate(this._InitMinMax(params2.angle));
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
    const frameDecceleration = new Vector2(this._vel.x * decceleration * this._friction, this._vel.y * decceleration * this._friction);
    this._vel.Sub(frameDecceleration.Mult(elapsedTimeS));
    this._vel.Rotate(math.rand(-this._angleVariance, this._angleVariance));
    this.position.Add(this._vel.Clone().Mult(elapsedTimeS));
    const sprite = this.GetComponent("Sprite");
    const progress = Math.min(this._counter / this._lifetime, 1);
    if (this._scale) {
      sprite.scale = math.lerp(progress, this._scale.from, this._scale.to);
    }
    if (this._opacity) {
      sprite.opacity = math.lerp(progress, this._opacity.from, this._opacity.to);
    }
  }
};
var particle = {
  Emitter
};

// src/Lancelot.js
var __name = "Lancelot";
var __export2 = {
  Vector: Vector2,
  Game,
  Component,
  particle,
  drawable: drawable_exports,
  physics: physics_exports
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
