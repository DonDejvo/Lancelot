var __defProp = Object.defineProperty;
var __markAsModule = (target) => __defProp(target, "__esModule", { value: true });
var __export = (target, all) => {
  __markAsModule(target);
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
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

// src/core/renderer.js
var Renderer = class {
  constructor(params) {
    this._width = params.width;
    this._height = params.height;
    this._aspect = this._width / this._height;
    this._scale = 1;
    this.background = "black";
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
      const pos = elem.position.Clone();
      pos.Sub(cam.position);
      pos.Mult(cam.scale);
      const [width, height] = [elem.boundingBox.width, elem.boundingBox.height].map((_) => _ * cam.scale);
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
    }
  };
}();

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
    this._x = num;
  }
  set y(num) {
    this._y = num;
  }
  Copy(v1) {
    this._x = v1.x;
    this._y = v1.y;
  }
  Clone() {
    return new Vector2(this.x, this.y);
  }
  Add(v1) {
    this.x += v1.x;
    this.y += v1.y;
    return this;
  }
  Sub(v1) {
    this.x -= v1.x;
    this.y -= v1.y;
    return this;
  }
  Mult(s) {
    this.x *= s;
    this.y *= s;
    return this;
  }
  Norm() {
    [this.x, this.y] = [this.y, -this.x];
    return this;
  }
  Unit() {
    const z = this.Mag();
    if (z === 0) {
      return this;
    }
    this.x /= z;
    this.y /= z;
    return this;
  }
  Mag() {
    return Math.sqrt(Math.pow(this.x, 2) + Math.pow(this.y, 2));
  }
  Lerp(v1, alpha) {
    this.Add(v1.Clone().Sub(this).Mult(alpha));
    return this;
  }
  Angle() {
    return Math.atan2(this.y, this.x);
  }
  Rotate(angle) {
    const x = this.x * Math.cos(angle) - this.y * Math.sin(angle);
    const y = this.x * Math.sin(angle) + this.y * Math.cos(angle);
    this.x = x;
    this.y = y;
    return this;
  }
  static Dot(v1, v2) {
    return v1.x * v2.x + v1.y * v2.y;
  }
  static Dist(v1, v2) {
    return Math.sqrt(Math.pow(v1.x - v2.x, 2) + Math.pow(v1.y - v2.y, 2));
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
  constructor(parent, x = 0, y = 0) {
    super(x, y);
    this._parent = parent;
  }
  get x() {
    return this._x;
  }
  set x(num) {
    const vec = new Vector2(num, this._y);
    this._parent.position = vec;
    this._x = num;
  }
  get y() {
    return this._y;
  }
  set y(num) {
    const vec = new Vector2(this._x, num);
    this._parent.position = vec;
    this._y = num;
  }
};

// src/core/utils/position.js
var Position = class {
  constructor(parent) {
    this._parent = parent;
    this._pos = new PositionVector(parent);
    this._attached = [];
    this._moving = null;
  }
  Clip(e) {
    this._attached.push(e);
  }
  Unclip(e) {
    const i = this._attached.indexOf(e);
    if (i != -1) {
      this._attached.splice(i, 1);
    }
  }
  get position() {
    return this._pos;
  }
  set position(p) {
    for (let e of this._attached) {
      const offset = e._pos.Clone().Sub(this._pos);
      e._parent.position = p.Clone().Add(offset);
    }
    this._pos.Copy(p);
  }
  MoveTo(p, dur, timing = "linear") {
    this._moving = {
      counter: 0,
      dur,
      from: this._pos.Clone(),
      to: p,
      timing
    };
  }
  StopMoving() {
    this._moving = null;
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
      this._parent.position = anim.from.Clone().Lerp(anim.to, value);
      if (progress == 1) {
        this._moving = null;
      }
    }
  }
};

// src/core/camera.js
var Camera = class {
  constructor() {
    this._position = new Position(this);
    this._pos = this._position._pos;
    this.scale = 1;
    this._target = null;
    this._vel = new Vector2();
    this._scaling = null;
    this._shaking = null;
    this._offset = new Vector2();
  }
  get position() {
    return this._pos;
  }
  set position(vec) {
    this._position.position = vec;
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
      if (Vector2.Dist(this._pos, this._target._pos) < 1) {
        this.position = this._target._pos.Clone();
      } else {
        const t = 4 * elapsedTimeS;
        this.position = this._pos.Clone().Lerp(this._target._pos, t);
      }
    } else {
      const vel = this._vel.Clone();
      vel.Mult(elapsedTimeS);
      this.position = this._pos.Clone().Add(vel);
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
      this.position = this._pos.Clone().Sub(this._offset);
      this._offset.Copy(new Vector2(Math.sin(progress * Math.PI * 2 * anim.count) * anim.range, 0).Rotate(anim.angle));
      this.position = this._pos.Clone().Add(this._offset);
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
    this._pos = new PositionVector(this);
    this.offset = new Vector2();
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
    return this._pos;
  }
  set position(vec) {
    this._pos.Copy(vec);
    this._parent.SetPosition(vec.Clone().Sub(this.offset));
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
  constructor(params) {
    super();
    this._capture = params.capture;
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

// src/core/scene.js
var Scene = class {
  constructor(params) {
    this._resources = params.resources;
    this._input = params.input;
    this._bounds = params.bounds;
    this._cellDimensions = params.cellDimensions || [100, 100];
    this._relaxationCount = params.relaxationCount || 5;
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
  SetInteractive(entity, params) {
    this._interactiveEntities.push(entity);
    const interactive = new Interactive(params);
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
    e._components.forEach((c) => {
      if (c._type == "drawable") {
        this._AddDrawable(c);
      } else if (c._type == "body") {
        this._AddBody(e, c);
      }
    });
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

// src/core/game.js
var Game = class {
  constructor(params) {
    this._width = params.width;
    this._height = params.height;
    this._renderer = new Renderer({
      width: this._width,
      height: this._height
    });
    this._engine = new Engine();
    this._sceneManager = new SceneManager();
    this.timeout = this._engine.timeout;
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
  }
  get background() {
    return this._renderer.background;
  }
  set background(col) {
    this._renderer.background = col;
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
  }
  ShowSection(id) {
  }
  HideSection(id) {
  }
  CreateScene(n, params = {}) {
    const scene = new Scene({
      bounds: params.bounds || [[-1e3, -1e3], [1e3, 1e3]],
      cellDimensions: params.cellDimensions
    });
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
      path: this._path + "/" + p,
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

// src/core/entity.js
var Entity = class {
  constructor() {
    this._position = new Position(this);
    this._pos = this._position._pos;
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
  get parent() {
    return this._parent;
  }
  get position() {
    return this._pos;
  }
  set position(p) {
    this._position.position = p;
    this._components.forEach((c) => {
      c._pos.Copy(this._pos.Clone().Add(c.offset));
    });
  }
  get moving() {
    return this._position._moving;
  }
  Update(elapsedTimeS) {
    this._position.Update(elapsedTimeS);
    this._components.forEach((c) => {
      c.Update(elapsedTimeS);
    });
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
  AddComponent(c, n) {
    if (n === void 0) {
      n = c.constructor.name;
    }
    this._components.set(n, c);
    c._parent = this;
    c._pos.Copy(this._pos.Clone().Add(c.offset));
    c.InitComponent();
  }
  GetComponent(n) {
    return this._components.get(n);
  }
  FindEntity(n) {
    return this._parent.Get(n);
  }
};

// src/core/drawable/drawable.js
var drawable_exports = {};
__export(drawable_exports, {
  Circle: () => Circle,
  Drawable: () => Drawable,
  Picture: () => Picture,
  Rect: () => Rect,
  Sprite: () => Sprite,
  Text: () => Text
});
var Drawable = class extends Component {
  constructor(params) {
    super();
    this._type = "drawable";
    this._params = params;
    this._width = this._params.width || 0;
    this._height = this._params.height || 0;
    this._zIndex = this._params.zIndex || 0;
    this.flip = {
      x: this._params.flipX || false,
      y: this._params.flipY || false
    };
    this._rotationCount = this._params.rotationCount || 0;
    this.opacity = this._params.opacity !== void 0 ? this._params.opacity : 1;
    this._angle = this._params.angle || this._rotationCount * Math.PI / 2 || 0;
    this.boundingBox = { width: 0, height: 0, x: 0, y: 0 };
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
    this._UpdateBoundingBox();
  }
  set height(num) {
    this._height = num;
    this._UpdateBoundingBox();
  }
  set angle(num) {
    this._angle = num;
    this._UpdateBoundingBox();
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
  InitComponent() {
    this._UpdateBoundingBox();
  }
  _UpdateBoundingBox() {
    const vertices = new Array(4);
    vertices[0] = new Vector2(-this._width / 2, -this._height / 2).Rotate(this._angle);
    vertices[1] = new Vector2(this._width / 2, -this._height / 2).Rotate(this._angle);
    vertices[2] = new Vector2(this._width / 2, this._height / 2).Rotate(this._angle);
    vertices[3] = new Vector2(-this._width / 2, this._height / 2).Rotate(this._angle);
    let width = 0, height = 0;
    for (let i = 0; i < 2; ++i) {
      const w = Math.abs(vertices[i].x) + Math.abs(vertices[i + 2].x);
      const h = Math.abs(vertices[i].y) + Math.abs(vertices[i + 2].y);
      if (w > width) {
        width = w;
      }
      if (h > height) {
        height = h;
      }
    }
    this.boundingBox.width = width;
    this.boundingBox.height = height;
  }
  SetSize(w, h) {
    this._width = w;
    this._height = h;
  }
  Draw(_) {
  }
};
var Text = class extends Drawable {
  constructor(params) {
    super(params);
    this._text = this._params.text;
    this._lines = this._text.split(/\n/);
    this._padding = this._params.padding || 0;
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
    this._width = maxWidth;
  }
  Draw(ctx) {
    ctx.beginPath();
    ctx.save();
    ctx.globalAlpha = this.opacity;
    ctx.translate(this._pos.x, this._pos.y);
    ctx.rotate(this.angle);
    ctx.fillStyle = this._color;
    ctx.font = `${this._fontSize}px '${this._fontFamily}'`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (let i = 0; i < this.linesCount; ++i) {
      ctx.fillText(this._lines[i], 0, this.lineHeight * i - (this.linesCount - 1) / 2 * this.lineHeight);
    }
    ctx.restore();
  }
};
var Picture = class extends Drawable {
  constructor(params) {
    super(params);
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
    ctx.translate(this._pos.x, this._pos.y);
    ctx.scale(this.flip.x ? -1 : 1, this.flip.y ? -1 : 1);
    ctx.rotate(this.angle);
    ctx.drawImage(this._image, this._framePos.x * this._frameWidth, this._framePos.y * this._frameHeight, this._frameWidth, this._frameHeight, -this._width / 2, -this._height / 2, this._width, this._height);
    ctx.restore();
  }
};
var Rect = class extends Drawable {
  constructor(params) {
    super(params);
    this.background = this._params.background || "black";
    this.borderColor = this._params.borderColor || "black";
    this.borderWidth = this._params.borderWidth || 0;
  }
  Draw(ctx) {
    ctx.beginPath();
    ctx.save();
    ctx.globalAlpha = this.opacity;
    ctx.translate(this._pos.x, this._pos.y);
    ctx.rotate(this.angle);
    ctx.fillStyle = this.background;
    ctx.strokeStyle = this.borderColor;
    ctx.lineWidth = this.borderWidth;
    ctx.rect(-this._width / 2, -this._height / 2, this._width, this._height);
    ctx.fill();
    if (this.borderWidth > 0)
      ctx.stroke();
    ctx.restore();
  }
};
var Circle = class extends Drawable {
  constructor(params) {
    super(params);
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
    this._UpdateBoundingBox();
  }
  Draw(ctx) {
    ctx.beginPath();
    ctx.save();
    ctx.globalAlpha = this.opacity;
    ctx.translate(this._pos.x, this._pos.y);
    ctx.fillStyle = this.background;
    ctx.strokeStyle = this.borderColor;
    ctx.lineWidth = this.borderWidth;
    ctx.arc(0, 0, this._radius, 0, 2 * Math.PI);
    ctx.fill();
    if (this.borderWidth > 0)
      ctx.stroke();
    ctx.restore();
  }
};
var Sprite = class extends Drawable {
  constructor(params) {
    super(params);
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
    ctx.translate(this._pos.x, this._pos.y);
    ctx.scale(this.flip.x ? -1 : 1, this.flip.y ? -1 : 1);
    ctx.rotate(this.angle);
    ctx.drawImage(this._params.image, this._framePos.x * this._params.frameWidth, this._framePos.y * this._params.frameHeight, this._params.frameWidth, this._params.frameHeight, -this._width / 2, -this._height / 2, this._width, this._height);
    ctx.restore();
  }
};

// src/Lancelot.js
var __name = "Lancelot";
var __export2 = {
  Vector: Vector2,
  Game,
  Loader,
  Entity,
  Component,
  drawable: drawable_exports
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
