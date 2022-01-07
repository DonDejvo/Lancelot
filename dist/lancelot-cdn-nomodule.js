(() => {
  var __defProp = Object.defineProperty;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __markAsModule = (target) => __defProp(target, "__esModule", { value: true });
  var __export = (target, all) => {
    __markAsModule(target);
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __publicField = (obj, key, value) => {
    __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
    return value;
  };

  // src/utils/Loader.js
  var Loader = class {
    _toLoad = [];
    _size = 0;
    _counter = 0;
    _path = "";
    _onProgressHandler = null;
    _add(n, p, type) {
      let path;
      if (p.startsWith("/")) {
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
    image(n, p) {
      this._add(n, p, "image");
    }
    audio(n, p) {
      this._add(n, p, "audio");
    }
    json(n, p) {
      this._add(n, p, "json");
    }
    font(n, p) {
      this._add(n, p, "font");
    }
    onProgress(f) {
      this._onProgressHandler = f;
    }
    setPath(p) {
      this._path = p;
      if (!this._path.endsWith("/")) {
        this._path += "/";
      }
    }
    load(cb) {
      const loaded = new Map();
      if (this._size === 0) {
        cb(loaded);
        return;
      }
      for (let e of this._toLoad) {
        switch (e.type) {
          case "image":
            Loader.loadImage(e.path, (elem) => {
              this._handleCallback(loaded, e, elem, cb);
            });
            break;
          case "audio":
            Loader.loadAudio(e.path, (elem) => {
              this._handleCallback(loaded, e, elem, cb);
            });
            break;
          case "json":
            Loader.loadJSON(e.path, (elem) => {
              this._handleCallback(loaded, e, elem, cb);
            });
            break;
          case "font":
            Loader.loadFont(e.name, e.path, (elem) => {
              this._handleCallback(loaded, e, elem, cb);
            });
        }
      }
    }
    _handleCallback(loaded, obj, e, cb) {
      loaded.set(obj.name, e);
      ++this._counter;
      if (this._onProgressHandler) {
        this._onProgressHandler(this._counter / this._size, obj.path);
      }
      if (this._counter === this._size) {
        this._counter = this._size = 0;
        this._toLoad = [];
        cb(loaded);
      }
    }
    static loadImage(p, cb) {
      const image = new Image();
      image.src = p;
      image.addEventListener("load", () => {
        cb(image);
      }, { once: true });
    }
    static loadAudio(p, cb) {
      const audio = new Audio(p);
      audio.load();
      audio.addEventListener("canplaythrough", () => {
        cb(audio);
      }, { once: true });
    }
    static loadJSON(p, cb) {
      fetch(p).then((response) => response.json()).then((json) => cb(json));
    }
    static loadFont(n, p, cb) {
      const font = new FontFace(n, `url(${p})`);
      font.load().then((loadedFont) => {
        document.fonts.add(loadedFont);
        cb(n);
      });
    }
  };

  // src/utils/ParamParser.js
  var paramParser = function() {
    return {
      parseValue(data, val) {
        if (data !== void 0 && (typeof data == typeof val || val === null)) {
          return data;
        }
        return val;
      },
      parseObject(data, obj) {
        if (data) {
          for (let attr in obj) {
            obj[attr] = typeof obj[attr] == "object" && !Array.isArray(obj[attr]) && obj[attr] !== null ? this.parseObject(data[attr], obj[attr]) : this.parseValue(data[attr], obj[attr]);
            if (typeof obj[attr] == "object" && !Array.isArray(obj[attr]) && obj[attr] !== null) {
              if (obj[attr].min !== void 0 && obj[attr].max !== void 0) {
                obj[attr] = this.parseMinMax(data[attr], obj[attr]);
              } else {
                obj[attr] = this.parseObject(data[attr], obj[attr]);
              }
            } else {
              obj[attr] = this.parseValue(data[attr], obj[attr]);
            }
          }
        }
        return obj;
      },
      parseMinMax(data, obj) {
        if (data === void 0) {
          return obj;
        }
        if (typeof data == "number") {
          return { min: data, max: data };
        }
        if (typeof data == "object" && !Array.isArray(data) && data !== null) {
          let min, max;
          if (typeof data.min == "number" && data.min <= obj.max) {
            min = data.min;
          } else {
            min = obj.min;
          }
          if (typeof data.max == "number" && data.max >= obj.min) {
            max = data.max;
          } else {
            max = obj.max;
          }
          if (min <= max) {
            return { min, max };
          }
        }
        return obj;
      }
    };
  }();

  // src/utils/FPSMeter.js
  var FPSMeter = class {
    _fps = 60;
    _frameCounter = 0;
    _timeCounter = 0;
    get fps() {
      return this._fps;
    }
    update(elapsedTimeS) {
      this._timeCounter += elapsedTimeS;
      ++this._frameCounter;
      if (this._timeCounter >= 1) {
        this._timeCounter -= 1;
        this._fps = this._frameCounter;
        this._frameCounter = 0;
      }
    }
  };

  // src/core/Engine.js
  var Engine = class {
    _paused = true;
    _step;
    _fpsMeter = new FPSMeter();
    _minFps = 20;
    constructor(step) {
      this._step = step;
    }
    get paused() {
      return this._paused;
    }
    _RAF() {
      this._frame = window.requestAnimationFrame((timestamp) => {
        if (!this._paused) {
          this._RAF();
        }
        const elapsedTime = timestamp - this._previousRAF;
        this._fpsMeter.update(elapsedTime * 1e-3);
        this._step(Math.min(elapsedTime, 1e3 / this._minFps));
        this._previousRAF = timestamp;
      });
    }
    start() {
      this._paused = false;
      this._previousRAF = performance.now();
      this._RAF();
    }
    stop() {
      this._paused = true;
      window.cancelAnimationFrame(this._frame);
    }
  };

  // src/core/Renderer.js
  var Renderer = class {
    _width;
    _height;
    _aspect;
    _scale;
    _parentElement;
    _container;
    _canvas;
    _context;
    _quality;
    constructor(width, height, quality = 1, parentElement = document.body) {
      this._width = width;
      this._height = height;
      this._quality = quality;
      this._parentElement = parentElement;
      this._aspect = this._width / this._height;
      this._scale = 1;
      this._initContainer();
      this._initCanvas();
      this._onResize();
      window.addEventListener("resize", () => this._onResize());
    }
    get canvas() {
      return this._canvas;
    }
    render(scenes) {
      const ctx = this._context;
      ctx.beginPath();
      ctx.clearRect(0, 0, this._width, this._height);
      const w = this._width * this._quality;
      const h = this._height * this._quality;
      for (let i = scenes.length - 1; i >= 0; --i) {
        const scene = scenes[i];
        if (scene.hidden) {
          continue;
        }
        if (!scene.paused) {
          scene.render(w, h, this._quality);
        }
        scene.draw(ctx, w, h, this._quality);
      }
    }
    displayToSceneCoords(scene, x, y) {
      const boundingRect = this._canvas.getBoundingClientRect();
      const scaledX = (x - boundingRect.x) / this._scale;
      const scaledY = (y - boundingRect.y) / this._scale;
      const cam = scene.camera;
      return {
        x: (scaledX - this._width / 2) / cam.scale + cam.position.x,
        y: (scaledY - this._height / 2) / cam.scale + cam.position.y
      };
    }
    _initContainer() {
      const con = this._container = document.createElement("div");
      con.style.width = this._width + "px";
      con.style.height = this._height + "px";
      con.style.position = "relative";
      con.style.left = "50%";
      con.style.top = "0%";
      con.style.transformOrigin = "center";
      this._parentElement.appendChild(con);
    }
    _initCanvas() {
      const cnv = this._canvas = document.createElement("canvas");
      cnv.width = this._width * this._quality;
      cnv.height = this._height * this._quality;
      this._context = cnv.getContext("2d");
      cnv.style.position = "absolute";
      cnv.style.left = "0";
      cnv.style.top = "0";
      cnv.style.width = "100%";
      cnv.style.height = "100%";
      cnv.style.display = "block";
      cnv.style.imageRendering = "pixelated";
      this._container.appendChild(cnv);
    }
    _onResize() {
      const [width, height] = [this._parentElement.clientWidth, this._parentElement.clientHeight];
      if (width / height > this._aspect) {
        this._scale = height / this._height;
      } else {
        this._scale = width / this._width;
      }
      this._container.style.transform = "translate(-50%, calc(-50% + " + this._height / 2 * this._scale + "px)) scale(" + this._scale + ")";
      this._context.imageSmoothingEnabled = false;
    }
  };

  // src/core/SceneManager.js
  var SceneManager = class {
    _scenes = [];
    get scenes() {
      return this._scenes.map((e) => e.scene);
    }
    add(scene, name, zIndex = 0) {
      let wrapper = {
        scene,
        name,
        zIndex
      };
      this._scenes.push(wrapper);
      for (let i = this._scenes.length - 1; i > 0; --i) {
        if (wrapper.zIndex < this._scenes[i - 1].zIndex) {
          break;
        }
        [this._scenes[i], this._scenes[i - 1]] = [this._scenes[i - 1], this._scenes[i]];
      }
    }
    get(name) {
      return this._scenes.find((e) => e.name == name).scene;
    }
    setZIndex(name, zIndex) {
      const scene = this.get(name);
      if (scene) {
        this.remove(name);
        this.add(scene, name, zIndex);
      }
    }
    remove(name) {
      const idx = this._scenes.findIndex((e) => e.name == name);
      if (idx != -1) {
        this._scenes.splice(idx, 1);
        return true;
      }
      return false;
    }
  };

  // src/utils/Vector.js
  var Vector = class {
    _x;
    _y;
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
      this.set(num, this.y);
    }
    set y(num) {
      this.set(this.x, num);
    }
    set(x, y) {
      this._x = x;
      this._y = y;
    }
    copy(v1) {
      this.set(v1.x, v1.y);
      return this;
    }
    clone() {
      return new Vector(this.x, this.y);
    }
    add(v1) {
      this.set(this.x + v1.x, this.y + v1.y);
      return this;
    }
    sub(v1) {
      this.set(this.x - v1.x, this.y - v1.y);
      return this;
    }
    mult(s) {
      this.set(this.x * s, this.y * s);
      return this;
    }
    norm() {
      this.set(this.y, -this.x);
      return this;
    }
    unit() {
      const z = this.mag();
      if (z === 0) {
        return this;
      }
      this.set(this.x / z, this.y / z);
      return this;
    }
    mag() {
      return Math.hypot(this.x, this.y);
    }
    lerp(v1, alpha) {
      return this.add(v1.clone().sub(this).mult(alpha));
    }
    angle() {
      return Math.atan2(this.y, this.x);
    }
    rot(angle) {
      const sin = Math.sin(angle);
      const cos = Math.cos(angle);
      const x = this.x * cos - this.y * sin;
      const y = this.x * sin + this.y * cos;
      this.set(x, y);
      return this;
    }
    static fromAngle(angle) {
      return new Vector(1, 0).rot(angle);
    }
    static dot(v1, v2) {
      return v1.x * v2.x + v1.y * v2.y;
    }
    static dist(v1, v2) {
      return v1.clone().sub(v2).mag();
    }
    static cross(v1, v2) {
      return v1.x * v2.y - v1.y * v2.x;
    }
    static angleBetween(v1, v2) {
      const z1 = v1.mag();
      const z2 = v2.mag();
      if (z1 === 0 || z2 === 0) {
        return 0;
      }
      return Math.acos(Vector.dot(v1, v2) / (z1 * z2));
    }
  };
  var ParamVector = class extends Vector {
    _onChangeCallback;
    constructor(onChangeCallback, x = 0, y = 0) {
      super(x, y);
      this._onChangeCallback = onChangeCallback;
    }
    set(x, y) {
      if (x != this.x || y != this.y) {
        this._x = x;
        this._y = y;
        this._onChangeCallback();
      }
    }
  };

  // src/utils/TimeoutHandler.js
  var TimeoutHandler = class {
    _timeouts = [];
    set(f, dur) {
      const t = { action: f, dur, counter: 0 };
      this._timeouts.push(t);
      return t;
    }
    clear(t) {
      let idx = this._timeouts.indexOf(t);
      if (idx != -1) {
        this._timeouts.splice(idx, 1);
      }
    }
    update(elapsedTime) {
      for (let i = 0; i < this._timeouts.length; ++i) {
        const timeout = this._timeouts[i];
        if ((timeout.counter += elapsedTime) >= timeout.dur) {
          timeout.action();
          this._timeouts.splice(i--, 1);
        }
      }
    }
  };

  // src/utils/Math.js
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
      isBetween(x, a, b) {
        return x >= a && x <= b;
      },
      sat(x) {
        return this.clamp(x, 0, 1);
      },
      choice(arr) {
        const len = arr.length;
        return arr[this.randint(0, len - 1)];
      },
      shuffle(arr) {
        const len = arr.length;
        for (let i = 0; i < len; ++i) {
          const j = this.randint(0, len - 1);
          [arr[i], arr[j]] = [arr[j], arr[i]];
        }
      },
      easeIn(x) {
        return Math.cos(Math.PI * (1 + 0.5 * x)) + 1;
      },
      easeOut(x) {
        return Math.sin(Math.PI * 0.5 * x);
      },
      easeInOut(x) {
        return Math.cos(Math.PI * (1 + x)) / 2 + 0.5;
      }
    };
  }();

  // src/utils/Animator.js
  var Animator = class {
    _value;
    _anim = null;
    constructor(val) {
      this._value = val;
    }
    get value() {
      return this._value;
    }
    set value(val) {
      this._value = val;
    }
    animate(val, dur, timing = "linear", onEnd = null) {
      this._anim = {
        counter: 0,
        dur,
        from: this._value,
        to: val,
        timing,
        onEnd
      };
    }
    isAnimating() {
      return this._anim !== null;
    }
    stopAnimating() {
      this._anim = null;
    }
    update(elapsedTimeS) {
      if (this._anim) {
        const anim = this._anim;
        anim.counter += elapsedTimeS * 1e3;
        const progress = math.sat(anim.counter / anim.dur);
        let value;
        switch (anim.timing) {
          case "linear":
            value = progress;
            break;
          case "ease-in":
            value = math.easeIn(progress);
            break;
          case "ease-out":
            value = math.easeOut(progress);
            break;
          case "ease-in-out":
            value = math.easeInOut(progress);
            break;
          default:
            value = progress;
        }
        this._value = math.lerp(value, anim.from, anim.to);
        if (progress == 1) {
          this.stopAnimating();
          if (anim.onEnd) {
            anim.onEnd();
          }
        }
      }
    }
  };

  // src/utils/PositionManager.js
  var PositionManager = class {
    _pos;
    _parent = null;
    _fixed = false;
    _offset;
    _attached = [];
    _anim = null;
    constructor() {
      this._pos = new ParamVector(this._onPositionChange.bind(this));
      this._offset = new ParamVector(this._onOffsetChange.bind(this));
    }
    get position() {
      return this._pos;
    }
    set position(v) {
      this._pos.copy(v);
    }
    get offset() {
      return this._offset;
    }
    set offset(v) {
      this._offset.copy(v);
    }
    clip(p, fixed = false) {
      this._attached.push(p);
      p._parent = this;
      p._fixed = fixed;
      p._offset.copy(p.position.clone().sub(this._pos));
    }
    unclip(p) {
      const i = this._attached.indexOf(p);
      if (i != -1) {
        this._attached.splice(i, 1);
        p._parent = null;
      }
    }
    moveTo(v, dur, timing = "linear", onEnd = null) {
      this._anim = {
        counter: 0,
        dur,
        from: this.position.clone(),
        to: v,
        timing,
        onEnd
      };
    }
    moveBy(v, dur, timing = "linear", onEnd = null) {
      this.moveTo(this.position.clone().add(v), dur, timing, onEnd);
    }
    stopMoving() {
      this._anim = null;
    }
    isMoving() {
      return this._anim != null;
    }
    update(elapsedTimeS) {
      if (this._anim) {
        const anim = this._anim;
        anim.counter += elapsedTimeS * 1e3;
        const progress = math.sat(anim.counter / anim.dur);
        let value;
        switch (anim.timing) {
          case "linear":
            value = progress;
            break;
          case "ease-in":
            value = math.easeIn(progress);
            break;
          case "ease-out":
            value = math.easeOut(progress);
            break;
          case "ease-in-out":
            value = math.easeInOut(progress);
            break;
          default:
            value = progress;
        }
        this._pos.copy(anim.from.clone().lerp(anim.to, value));
        if (progress == 1) {
          this.stopMoving();
          if (anim.onEnd) {
            anim.onEnd();
          }
        }
      }
    }
    _onPositionChange() {
      if (this._parent) {
        if (this._fixed) {
          this._parent.position.copy(this._pos.clone().sub(this._offset));
        } else {
          this._offset.copy(this._pos.clone().sub(this._parent.position));
        }
      }
      for (let p of this._attached) {
        p.position.copy(this._pos.clone().add(p._offset));
      }
    }
    _onOffsetChange() {
      if (this._parent && this._fixed) {
        this._pos.copy(this._parent.position.clone().add(this._offset));
      }
    }
  };

  // src/core/Component.js
  var Component = class {
    _type = "";
    _parent = null;
    _position = new PositionManager();
    _angle = new Animator(0);
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
    set position(v) {
      this._position.position = v;
    }
    get offset() {
      return this._position.offset;
    }
    set offset(v) {
      this._position.offset = v;
    }
    get angle() {
      return this._angle.value;
    }
    set angle(num) {
      this._angle.value = num;
    }
    initComponent() {
    }
    getComponent(n) {
      return this._parent.getComponent(n);
    }
    rotate(val, dur, timing = "linear", onEnd = null) {
      this._angle.animate(val, dur, timing, onEnd);
    }
    update(_) {
    }
  };

  // src/interactive/Interactive.js
  var Interactive = class extends Component {
    _eventHandlers = new Map();
    _id = -1;
    constructor() {
      super();
      this._type = "interactive";
    }
    on(type, handler, capture = false) {
      if (!this._eventHandlers.has(type)) {
        this._eventHandlers.set(type, []);
      }
      const handlers = this._eventHandlers.get(type);
      handlers.push({ handler, capture });
    }
    off(type, handler) {
      if (!this._eventHandlers.has(type)) {
        return;
      }
      const handlers = this._eventHandlers.get(type);
      const idx = handlers.findIndex((e) => e.handler == handler);
      if (idx != -1) {
        handlers.splice(idx, 1);
      }
    }
    handleEvent(type, event) {
      if (!this._eventHandlers.has(type)) {
        return false;
      }
      let captured = false;
      const handlers = this._eventHandlers.get(type);
      for (let e of handlers) {
        e.handler(event);
        if (e.capture) {
          captured = true;
        }
      }
      return captured;
    }
  };

  // src/utils/Quadtree.js
  var AABB = class {
    constructor(x, y, w, h, userData = null) {
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
    _bounds;
    _limit;
    _aabb;
    _divided = false;
    _data = [];
    _topLeft = null;
    _topRight = null;
    _bottomLeft = null;
    _bottomRight = null;
    _maxRecursionDepth = 5;
    constructor(bounds, limit) {
      this._bounds = bounds;
      const w = bounds[1][0] - bounds[0][0];
      const h = bounds[1][1] - bounds[0][1];
      this._aabb = new AABB(bounds[0][0] + w / 2, bounds[0][1] + h / 2, w, h);
      this._limit = limit;
    }
    newClient(position, dimensions) {
      const aabb = new AABB(position[0], position[1], dimensions[0], dimensions[1]);
      this._insert(aabb);
      return aabb;
    }
    updateClient(aabb) {
      this._insert(aabb);
    }
    findNear(position, bounds) {
      const [w, h] = bounds;
      const [x, y] = position;
      const aabb = new AABB(x, y, w, h);
      const res = this._search(aabb);
      return res == void 0 ? [] : Array.from(res);
    }
    clear() {
      this._data = [];
      this._divided = false;
      this._topRight = null;
      this._topLeft = null;
      this._bottomLeft = null;
      this._bottomRight = null;
    }
    draw(ctx) {
      ctx.beginPath();
      ctx.strokeStyle = "white";
      ctx.strokeRect(this._aabb.x - this._aabb.w / 2, this._aabb.y - this._aabb.h / 2, this._aabb.w, this._aabb.h);
      if (this._divided) {
        this._topLeft.draw(ctx);
        this._topRight.draw(ctx);
        this._bottomLeft.draw(ctx);
        this._bottomRight.draw(ctx);
      }
    }
    _divide() {
      const bounds = this._bounds;
      const w = bounds[1][0] - bounds[0][0];
      const h = bounds[1][1] - bounds[0][1];
      this._topLeft = new QuadTree([[bounds[0][0], bounds[0][1]], [bounds[0][0] + w / 2, bounds[0][1] + h / 2]], this._limit);
      this._topRight = new QuadTree([[bounds[0][0] + w / 2, bounds[0][1]], [bounds[0][0] + w, bounds[0][1] + h / 2]], this._limit);
      this._bottomLeft = new QuadTree([[bounds[0][0], bounds[0][1] + h / 2], [bounds[0][0] + w / 2, bounds[0][1] + h]], this._limit);
      this._bottomRight = new QuadTree([[bounds[0][0] + w / 2, bounds[0][1] + h / 2], [bounds[0][0] + w, bounds[0][1] + h]], this._limit);
      for (let data of this._data) {
        this._topLeft._insert(data);
        this._topRight._insert(data);
        this._bottomLeft._insert(data);
        this._bottomRight._insert(data);
      }
      this._divided = true;
    }
    _search(aabb, res) {
      if (res == void 0) {
        res = new Set();
      }
      if (!aabb._vsAabb(this._aabb))
        return;
      if (!this._divided) {
        for (let data of this._data) {
          if (aabb._vsAabb(data)) {
            res.add(data);
          }
        }
      } else {
        this._topLeft._search(aabb, res);
        this._topRight._search(aabb, res);
        this._bottomLeft._search(aabb, res);
        this._bottomRight._search(aabb, res);
      }
      return res;
    }
    _insert(aabb, depth = 0) {
      if (!this._aabb._vsAabb(aabb)) {
        return false;
      }
      if (this._data.length < this._limit || depth > this._maxRecursionDepth) {
        this._data.push(aabb);
        return true;
      } else {
        if (!this._divided) {
          this._divide();
        }
        this._topLeft._insert(aabb, depth + 1);
        this._topRight._insert(aabb, depth + 1);
        this._bottomLeft._insert(aabb, depth + 1);
        this._bottomRight._insert(aabb, depth + 1);
      }
    }
  };

  // src/physics/Joint.js
  var Joint = class {
    _body1;
    _body2;
    _offset1;
    _offset2;
    _length;
    _strength;
    constructor(b1, b2, params) {
      this._body1 = b1;
      this._body2 = b2;
      const offset1 = paramParser.parseObject(params.offset1, { x: 0, y: 0 });
      this._offset1 = new Vector(offset1.x, offset1.y);
      const offset2 = paramParser.parseObject(params.offset2, { x: 0, y: 0 });
      this._offset2 = new Vector(offset2.x, offset2.y);
      const start2 = this._body1.position.clone().add(this._offset1.clone().rot(this._body1.angle));
      const end = this._body2.position.clone().add(this._offset2.clone().rot(this._body2.angle));
      this._length = paramParser.parseValue(params.length, Math.max(Vector.dist(start2, end), 1));
      this._strength = paramParser.parseValue(params.strength, 1);
    }
    get offset1() {
      return this._offset1;
    }
    set offset1(v) {
      this._offset1.copy(v);
    }
    get offset2() {
      return this._offset2;
    }
    set offset2(v) {
      this._offset2.copy(v);
    }
    get length() {
      return this._length;
    }
    set length(val) {
      this._length = Math.max(val, 1);
    }
    get strength() {
      return this._strength;
    }
    set strength(val) {
      this._strength = math.sat(val);
    }
    update(_) {
    }
  };
  var ElasticJoint = class extends Joint {
    constructor(b1, b2, params) {
      super(b1, b2, params);
    }
    update(elapsedTimeS) {
      if (this._body1.mass === 0 && this._body2.mass === 0)
        return;
      const offset1 = this.offset1.clone().rot(this._body1.angle);
      const offset2 = this.offset2.clone().rot(this._body2.angle);
      const start2 = this._body1.position.clone().add(offset1);
      const end = this._body2.position.clone().add(offset2);
      const vec = start2.clone().sub(end);
      const n = vec.clone().unit();
      const dist = vec.mag();
      const relLenDiff = (dist - this.length) / this.length;
      const relVel = n.clone().mult(relLenDiff * -this.strength * 512 / (this._body1.inverseMass + this._body2.inverseMass));
      const vel1 = relVel.clone().mult(this._body1.inverseMass);
      this._body1.velocity.add(vel1.clone().mult(elapsedTimeS));
      this._body1.angularVelocity += Vector.cross(offset1, vel1.clone().mult(1 / this._body1.inertia)) * elapsedTimeS;
      const vel2 = relVel.clone().mult(this._body2.inverseMass);
      this._body2.velocity.sub(vel2.clone().mult(elapsedTimeS));
      this._body2.angularVelocity -= Vector.cross(offset2, vel2.clone().mult(1 / this._body2.inertia)) * elapsedTimeS;
    }
  };
  var SolidJoint = class extends Joint {
    constructor(b1, b2, params) {
      super(b1, b2, params);
    }
    update(elapsedTimeS) {
      if (this._body1.mass === 0 && this._body2.mass === 0)
        return;
      const offset1 = this.offset1.clone().rot(this._body1.angle);
      const offset2 = this.offset2.clone().rot(this._body2.angle);
      const start2 = this._body1.position.clone().add(offset1);
      const end = this._body2.position.clone().add(offset2);
      const vec = start2.clone().sub(end);
      const n = vec.clone().unit();
      const dist = vec.mag();
      const repos = 16;
      const diff = n.clone().mult((dist - this.length) * -1 / (this._body1.inverseMass + this._body2.inverseMass));
      this._body1.position.add(diff.clone().mult(this._body1.inverseMass * repos * elapsedTimeS));
      this._body2.position.sub(diff.clone().mult(this._body2.inverseMass * repos * elapsedTimeS));
      const relLenDiff = (dist - this.length) / this.length;
      const relVel = n.clone().mult(relLenDiff * -this.strength * 512 / (this._body1.inverseMass + this._body2.inverseMass));
      const vel1 = relVel.clone().mult(this._body1.inverseMass);
      this._body1.velocity.add(vel1.clone().mult(elapsedTimeS));
      this._body1.angularVelocity += Vector.cross(offset1, vel1.clone().mult(1 / this._body1.inertia)) * elapsedTimeS;
      const vel2 = relVel.Clone().Mult(this._body2.inverseMass);
      this._body2.velocity.Sub(vel2.Clone().Mult(elapsedTimeS));
      this._body2.angularVelocity -= Vector.Cross(offset2, vel2.Clone().Mult(1 / this._body2.inertia)) * elapsedTimeS;
    }
  };

  // src/physics/Body.js
  var Body = class extends Component {
    _vel = new Vector();
    _angVel = 0;
    _passiveVel = new Vector();
    _behavior = [];
    _friction;
    _mass;
    _rotation;
    _collisions = {
      left: new Set(),
      right: new Set(),
      top: new Set(),
      bottom: new Set(),
      all: new Set()
    };
    _options;
    _followBottomObject;
    _resized = false;
    _behaviorIds = 0;
    _joints = [];
    constructor(params) {
      super();
      this._type = "body";
      this._friction = paramParser.parseObject(params.friction, { x: 0, y: 0, angular: 0 });
      this._mass = paramParser.parseValue(params.mass, 0);
      this._rotation = paramParser.parseValue(params.rotation, 0);
      this._options = paramParser.parseObject(params.options, {
        axes: { x: true, y: true },
        sides: { left: true, right: true, top: true, bottom: true }
      });
      this._followBottomObject = paramParser.parseValue(params.followBottomObject, false);
    }
    get velocity() {
      return this._vel;
    }
    set velocity(vec) {
      this._vel.copy(vec);
    }
    get angularVelocity() {
      return this._angVel;
    }
    set angularVelocity(num) {
      this._angVel = num;
    }
    get mass() {
      return this._mass;
    }
    set mass(val) {
      this._mass = Math.max(val, 0);
    }
    get friction() {
      return this._friction;
    }
    get rotation() {
      return this._rotation;
    }
    set rotation(val) {
      this._rotation = val;
    }
    get inverseMass() {
      return this._mass === 0 ? 0 : 1 / this._mass;
    }
    get inertia() {
      return 0;
    }
    get collisions() {
      return this._collisions;
    }
    get options() {
      return this._options;
    }
    get followBottomObject() {
      return this._followBottomObject;
    }
    set followBottomObject(val) {
      this._followBottomObject = val;
    }
    get passiveVelocity() {
      return this._passiveVel;
    }
    set passiveVelocity(v) {
      this._passiveVel.copy(v);
    }
    initComponent() {
      this.scene.addBody(this.parent, this);
    }
    getBoundingRect() {
      return {
        width: 0,
        height: 0
      };
    }
    addBehavior(groups, type, options, name) {
      if (name === void 0) {
        name = this._generateBehaviorName();
      }
      this._behavior.push({
        groups: groups.split(" "),
        type,
        options: paramParser.parseObject(options, {
          bounce: 0,
          friction: 0,
          action: null
        }),
        name
      });
    }
    removeBehavior(name) {
      const idx = this._behavior.findIndex((e) => e.name == name);
      if (idx != -1) {
        this._behavior.splice(idx, 1);
      }
    }
    updateBehavior(name, options = {}) {
      const behavior = this._behavior.find((e) => e.name == name);
      if (behavior) {
        for (let attr in options) {
          behavior.options[attr] = options[attr];
        }
      }
    }
    join(body, type, params) {
      if (params === void 0) {
        params = {};
      }
      let joint;
      switch (type) {
        case "elastic":
          joint = new ElasticJoint(this, body, params);
          break;
        case "solid":
          joint = new SolidJoint(this, body, params);
          break;
      }
      if (!joint) {
        return null;
      }
      const world = this.scene.world;
      world._addJoint(joint);
      this._joints.push(joint);
      body._joints.push(joint);
      return joint;
    }
    contains(v) {
      return false;
    }
    applyForce(v, point) {
      const rPoint = point.clone().sub(this.position);
      const vel = v.clone().mult(this.inverseMass);
      this.velocity.add(vel);
      this.angularVelocity += Vector.cross(rPoint, vel.clone().mult(1 / this.inertia));
    }
    updatePosition(elapsedTimeS) {
      const decceleration = 30;
      const frame_decceleration = new Vector(this._vel.x * this._friction.x * decceleration, this._vel.y * this._friction.y * decceleration);
      this._vel.sub(frame_decceleration.mult(elapsedTimeS));
      const vel = this._vel.clone().mult(elapsedTimeS);
      this.position.add(vel);
      this.position.add(this._passiveVel.clone().mult(elapsedTimeS));
      this._passiveVel.set(0, 0);
      this._angVel -= this._angVel * this._friction.angular * decceleration * elapsedTimeS;
      this.angle += this._angVel * elapsedTimeS;
    }
    handleBehavior() {
      const controller = this.getComponent("QuadtreeController");
      const boundingRect = this.getBoundingRect();
      for (let behavior of this._behavior) {
        const entities = controller.findNearby(boundingRect.width, boundingRect.height).filter((e) => {
          return behavior.groups.map((g) => e.groupList.has(g)).some((_) => _);
        });
        entities.sort((a, b) => {
          const boundingRectA = a.body.getBoundingRect();
          const boundingRectB = b.body.getBoundingRect();
          const distA = Vector.dist(this.position, a.body.position) / new Vector(boundingRect.width + boundingRectA.width, boundingRect.height + boundingRectA.height).mag();
          const distB = Vector.dist(this.position, b.body.position) / new Vector(boundingRect.width + boundingRectB.width, boundingRect.height + boundingRectB.height).mag();
          return distA - distB;
        });
        for (let e of entities) {
          let info;
          switch (behavior.type) {
            case "detect":
              info = detectCollision(this, e.body);
              if (info.collide) {
                if (behavior.options.action) {
                  behavior.options.action(e.body, info.point);
                }
              }
              break;
            case "resolve":
              info = resolveCollision(this, e.body, behavior.options);
              if (info.collide) {
                if (behavior.options.action) {
                  behavior.options.action(e.body, info.point);
                }
              }
              break;
          }
        }
      }
    }
    draw(_) {
    }
    _generateBehaviorName() {
      ++this._behaviorIds;
      return "__behavior__" + this._behaviorIds;
    }
  };
  var Polygon = class extends Body {
    _points;
    constructor(params) {
      super(params);
      this._points = params.points;
    }
    get inertia() {
      let maxDist = 0;
      for (let i = 0; i < verts.length; ++i) {
        const v = verts[i];
        const dist = v.mag();
        if (dist > maxDist) {
          maxDist = dist;
        }
      }
      return Math.PI * maxDist ** 2 * 0.5 / this.rotation;
    }
    getBoundingRect() {
      const verts2 = this._getVertices();
      let maxDist = 0;
      for (let i = 0; i < verts2.length; ++i) {
        const v = verts2[i];
        const dist = v.mag();
        if (dist > maxDist) {
          maxDist = dist;
        }
      }
      const d = maxDist * 2;
      return {
        width: d,
        height: d
      };
    }
    contains(p) {
      const verts2 = this.getComputedVertices();
      const vertsLen = verts2.length;
      let count = 0;
      for (let i = 0; i < vertsLen; ++i) {
        const v1 = verts2[i];
        const v2 = verts2[(i + 1) % vertsLen];
        if ((p.y - v1.y) * (p.y - v2.y) <= 0 && (p.x <= v1.x || p.x <= v2.x) && (v1.x >= p.x && v2.x >= p.x || (v2.x - v1.x) * (p.y - v1.y) / (v2.y - v1.y) >= p.x - v1.x)) {
          ++count;
        }
      }
      return count % 2;
    }
    getComputedVertices() {
      const verts2 = this._getVertices();
      for (let i = 0; i < verts2.length; ++i) {
        const v = verts2[i];
        v.rot(this.angle);
        v.add(this.position);
      }
      return verts2;
    }
    draw(ctx) {
      ctx.beginPath();
      ctx.strokeStyle = "white";
      const verts2 = this.getComputedVertices();
      let vert = verts2[0];
      ctx.moveTo(vert.x, vert.y);
      for (let i = 1; i < verts2.length; ++i) {
        vert = verts2[i];
        ctx.lineTo(vert.x, vert.y);
      }
      ctx.closePath();
      ctx.stroke();
    }
    _getVertices() {
      return this._points.map((v) => new Vector(v[0], v[1]));
    }
    static getFaceNormals(vertices) {
      let normals = [];
      for (let i = 0; i < vertices.length; i++) {
        let v1 = vertices[i].clone();
        let v2 = vertices[(i + 1) % vertices.length].clone();
        normals[i] = v2.clone().sub(v1).norm().unit();
      }
      return normals;
    }
    static findSupportPoint(vertices, n, ptOnEdge) {
      let max = -Infinity;
      let index = -1;
      for (let i = 0; i < vertices.length; i++) {
        let v = vertices[i].clone().sub(ptOnEdge);
        let proj = Vector.dot(v, n);
        if (proj > 0 && proj > max) {
          max = proj;
          index = i;
        }
      }
      return { sp: vertices[index], depth: max };
    }
  };
  var Box = class extends Polygon {
    _width;
    _height;
    constructor(params) {
      super(params);
      this._width = params.width;
      this._height = params.height;
      this._initPoints();
    }
    get width() {
      return this._width;
    }
    get height() {
      return this._height;
    }
    set width(val) {
      this._width = Math.max(val, 0);
      this._initPoints();
    }
    set height(val) {
      this._height = Math.max(val, 0);
      this._initPoints();
    }
    get inertia() {
      return (this.width ** 2 + this.height ** 2) * 0.1 / this.rotation;
    }
    _initPoints() {
      this._points = [
        [-this._width / 2, -this._height / 2],
        [this._width / 2, -this._height / 2],
        [this._width / 2, this._height / 2],
        [-this._width / 2, this._height / 2]
      ];
      this._resized = true;
    }
  };
  var RegularPolygon = class extends Polygon {
    _radius;
    _sides;
    constructor(params) {
      super(params);
      this._radius = params.radius;
      this._sides = params.sides;
      this._initPoints();
    }
    get radius() {
      return this._radius;
    }
    set radius(val) {
      this._radius = Math.max(val, 0);
      this._initPoints();
    }
    get sides() {
      return this._sides;
    }
    set sides(val) {
      this._sides = Math.max(val, 3);
      this._initPoints();
    }
    get inertia() {
      return Math.PI * this.radius ** 2 * 0.2 / this.rotation;
    }
    getBoundingRect() {
      return { width: 2 * this.radius, height: 2 * this.radius };
    }
    _initPoints() {
      const points = [];
      for (let i = 0; i < this._sides; ++i) {
        const angle = Math.PI * 2 / this._sides * i;
        points.push([Math.cos(angle) * this._radius, Math.sin(angle) * this._radius]);
      }
      this._points = points;
      this._resized = true;
    }
  };
  var Ball = class extends Body {
    _radius;
    constructor(params) {
      super(params);
      this._radius = params.radius;
    }
    get radius() {
      return this._radius;
    }
    set radius(val) {
      this._radius = Math.max(val, 0);
      this._resized = true;
    }
    get inertia() {
      return Math.PI * this.radius ** 2 * 0.4 / this.rotation;
    }
    getBoundingRect() {
      return { width: 2 * this.radius, height: 2 * this.radius };
    }
    findSupportPoint(n, ptOnEdge) {
      let circVerts = [];
      circVerts[0] = this.position.clone().add(n.clone().mult(this.radius));
      circVerts[1] = this.position.clone().add(n.clone().mult(-this.radius));
      let max = -Infinity;
      let index = -1;
      for (let i = 0; i < circVerts.length; i++) {
        let v = circVerts[i].clone().sub(ptOnEdge);
        let proj = Vector.dot(v, n);
        if (proj > 0 && proj > max) {
          max = proj;
          index = i;
        }
      }
      return { sp: circVerts[index], depth: max, n };
    }
    findNearestVertex(vertices) {
      let dist = Infinity;
      let index = 0;
      for (let i = 0; i < vertices.length; i++) {
        let l = Vector.dist(vertices[i], this.position);
        if (l < dist) {
          dist = l;
          index = i;
        }
      }
      return vertices[index];
    }
    contains(p) {
      return Vector.dist(p, this.position) <= this.radius;
    }
    draw(ctx) {
      ctx.beginPath();
      ctx.strokeStyle = "white";
      ctx.arc(0, 0, this.radius, 0, 2 * Math.PI);
      ctx.stroke();
    }
  };
  var Ray = class extends Body {
    _range;
    constructor(params) {
      super(params);
      this._range = params.range;
    }
    get range() {
      return this._range;
    }
    set range(num) {
      this._range = num;
      this._resized = true;
    }
    get point() {
      return this.position.clone().add(new Vector(this.range, 0).rot(this.angle));
    }
    getBoundingRect() {
      return { width: 2 * this.range, height: 2 * this.range };
    }
    draw(ctx) {
      const p = this.point;
      ctx.beginPath();
      ctx.strokeStyle = "white";
      ctx.moveTo(0, 0);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
    }
  };
  var detectCollision = (b1, b2) => {
    if (b1 instanceof Ball && b2 instanceof Ball) {
      return detectCollisionBallVsBall(b1, b2);
    } else if (b1 instanceof Polygon && b2 instanceof Polygon) {
      return detectCollisionPolyVsPoly(b1, b2);
    } else if (b1 instanceof Ball && b2 instanceof Polygon) {
      return detectCollisionBallVsPoly(b1, b2);
    } else if (b1 instanceof Polygon && b2 instanceof Ball) {
      return detectCollisionBallVsPoly(b2, b1);
    } else if (b1 instanceof Ray && b2 instanceof Polygon) {
      return detectCollisionRayVsPoly(b1, b2);
    } else if (b1 instanceof Polygon && b2 instanceof Ray) {
      return detectCollisionRayVsPoly(b2, b1);
    } else if (b1 instanceof Ray && b2 instanceof Ball) {
      return detectCollisionRayVsBall(b1, b2);
    } else if (b1 instanceof Ball && b2 instanceof Ray) {
      return detectCollisionRayVsBall(b2, b1);
    } else if (b1 instanceof Ray && b2 instanceof Ray) {
      return detectCollisionRayVsRay(b2, b1);
    } else {
      return {
        collide: false
      };
    }
  };
  var detectCollisionLineVsLine = (a, b, c, d) => {
    const r = b.clone().sub(a);
    const s = d.clone().sub(c);
    const den = r.x * s.y - r.y * s.x;
    const u = ((c.x - a.x) * r.y - (c.y - a.y) * r.x) / den;
    const t = ((c.x - a.x) * s.y - (c.y - a.y) * s.x) / den;
    if (0 <= u && u <= 1 && 0 <= t && t <= 1) {
      return {
        collide: true,
        point: a.clone().add(r.clone().mult(t))
      };
    }
    return {
      collide: false
    };
  };
  var detectCollisionRayVsRay = (ray1, ray2) => {
    const info = detectCollisionLineVsLine(ray1.position, ray1.point, ray2.position, ray2.point);
    if (info.collide) {
      ray1._collisions.all.add(ray2);
      ray2._collisions.all.add(ray1);
    }
    return info;
  };
  var detectCollisionRayVsPoly = (ray, b) => {
    const rayPoint = ray.point;
    let minDist = Infinity;
    let point = null;
    const vertices = b.getComputedVertices();
    for (let i = 0; i < vertices.length; ++i) {
      const v1 = vertices[i];
      const v2 = vertices[(i + 1) % vertices.length];
      const info = detectCollisionLineVsLine(ray.position, rayPoint, v1, v2);
      if (info.collide) {
        const dist = Vector.dist(ray.position, info.point);
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
  var detectCollisionRayVsBall = (ray, b) => {
    const rayPoint = ray.point;
    const rayVec = rayPoint.clone().sub(ray.position).unit();
    const originToBall = b.position.clone().sub(ray.position);
    const r2 = b.radius ** 2;
    const originToBallLength2 = originToBall.mag() ** 2;
    const a = Vector.dot(originToBall, rayVec);
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
    const point = ray.position.clone().add(rayVec.clone().mult(t));
    if (Vector.dot(point.clone().sub(ray.position), rayPoint.clone().sub(ray.position)) < 0 || Vector.dist(point, ray.position) > ray.range) {
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
  var detectCollisionBallVsBall = (b1, b2) => {
    let v = b1.position.clone().sub(b2.position);
    let info = {};
    if (v.mag() < b1.radius + b2.radius) {
      info.normal = v.clone().unit();
      info.depth = b1.radius + b2.radius - v.mag();
      info.point = b1.position.clone().add(info.normal.clone().mult(b1.radius));
      info.collide = true;
      b1._collisions.all.add(b2);
      b2._collisions.all.add(b1);
      return info;
    }
    return {
      collide: false
    };
  };
  var detectCollisionPolyVsPoly = (b1, b2) => {
    const verts1 = b1.getComputedVertices();
    const verts2 = b2.getComputedVertices();
    const normals1 = Polygon.getFaceNormals(verts1);
    const normals2 = Polygon.getFaceNormals(verts2);
    let e1SupportPoints = [];
    for (let i = 0; i < normals1.length; i++) {
      let spInfo = Polygon.findSupportPoint(verts2, normals1[i].clone().mult(-1), verts1[i]);
      spInfo.n = normals1[i].clone();
      e1SupportPoints[i] = spInfo;
      if (spInfo.sp == void 0)
        return { collide: false };
    }
    let e2SupportPoints = [];
    for (let i = 0; i < normals2.length; i++) {
      let spInfo = Polygon.findSupportPoint(verts1, normals2[i].clone().mult(-1), verts2[i]);
      spInfo.n = normals2[i].clone();
      e2SupportPoints[i] = spInfo;
      if (spInfo.sp == void 0)
        return { collide: false };
    }
    e1SupportPoints = e1SupportPoints.concat(e2SupportPoints);
    let max = Infinity;
    let index = 0;
    for (let i = 0; i < e1SupportPoints.length; i++) {
      if (e1SupportPoints[i].depth < max) {
        max = e1SupportPoints[i].depth;
        index = i;
      }
    }
    let v = b2.position.clone().sub(b1.position);
    if (Vector.dot(v, e1SupportPoints[index].n) > 0) {
      e1SupportPoints[index].n.mult(-1);
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
  var detectCollisionBallVsPoly = (b1, b2) => {
    const verts2 = b2.getComputedVertices();
    const normals = Polygon.getFaceNormals(verts2);
    let e1SupportPoints = [];
    for (let i = 0; i < normals.length; i++) {
      let info2 = b1.findSupportPoint(normals[i].clone().mult(-1), verts2[i].clone());
      if (info2.sp == void 0)
        return { collide: false };
      e1SupportPoints[i] = info2;
    }
    let normal = b2.position.clone().sub(b1.position).unit().mult(-1);
    let info = Polygon.findSupportPoint(verts2, normal.clone(), b1.position.clone().add(normal.clone().mult(-b1.radius)));
    if (info.sp == void 0)
      return { collide: false };
    info.n = normal.clone();
    e1SupportPoints.push(info);
    let max = Infinity;
    let index = 0;
    for (let i = 0; i < e1SupportPoints.length; i++) {
      if (e1SupportPoints[i].depth < max) {
        max = e1SupportPoints[i].depth;
        index = i;
      }
    }
    let v = b2.position.clone().sub(b1.position);
    if (Vector.dot(v, e1SupportPoints[index].n) < 0) {
      e1SupportPoints[index].n.mult(-1);
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
  var resolveCollision = (b1, b2, options) => {
    if (b1 instanceof Ball && b2 instanceof Polygon) {
      [b1, b2] = [b2, b1];
    }
    const detect = detectCollision(b1, b2);
    if (detect.collide) {
      const res = {
        collide: true,
        point: detect.point
      };
      if (b1.mass === 0 && b2.mass === 0)
        return res;
      if (!(b1.options.axes.x && b2.options.axes.x)) {
        detect.normal.x = 0;
      }
      if (!(b1.options.axes.y && b2.options.axes.y)) {
        detect.normal.y = 0;
      }
      const bounce = options.bounce;
      const friction = options.friction;
      const directions = {
        left: new Vector(-1, 0),
        right: new Vector(1, 0),
        top: new Vector(0, -1),
        bottom: new Vector(0, 1)
      };
      let direction;
      if (Vector.dot(detect.normal, directions.left) >= Math.SQRT2 / 2) {
        direction = "left";
      } else if (Vector.dot(detect.normal, directions.right) >= Math.SQRT2 / 2) {
        direction = "right";
      } else if (Vector.dot(detect.normal, directions.top) >= Math.SQRT2 / 2) {
        direction = "top";
      } else if (Vector.dot(detect.normal, directions.bottom) >= Math.SQRT2 / 2) {
        direction = "bottom";
      }
      const r1 = detect.point.clone().sub(b1.position);
      const r2 = detect.point.clone().sub(b2.position);
      const w1 = b1.angularVelocity;
      const w2 = b2.angularVelocity;
      const v1 = b1._vel;
      const v2 = b2._vel;
      const vp1 = v1.clone().add(new Vector(-w1 * r1.y, w1 * r1.x));
      const vp2 = v2.clone().add(new Vector(-w2 * r2.y, w2 * r2.x));
      const relVel = vp1.clone().sub(vp2);
      const j = -(1 + bounce) * Vector.dot(relVel, detect.normal) / (b1.inverseMass + b2.inverseMass + Math.pow(Vector.cross(r1, detect.normal), 2) / b1.inertia + Math.pow(Vector.cross(r2, detect.normal), 2) / b2.inertia);
      const jn = detect.normal.clone().mult(j);
      const vel1 = jn.clone().mult(b1.inverseMass);
      const vel2 = jn.clone().mult(b2.inverseMass);
      const left = Vector.dot(jn, directions.left), right = Vector.dot(jn, directions.right), top = Vector.dot(jn, directions.top), bottom = Vector.dot(jn, directions.bottom);
      if ((left >= Math.SQRT2 / 2 || left < Math.SQRT2 / 2 && direction == "left") && (!b1.options.sides.right || !b2.options.sides.left)) {
        return res;
      } else if ((right >= Math.SQRT2 / 2 || right < Math.SQRT2 / 2 && direction == "right") && (!b1.options.sides.left || !b2.options.sides.right)) {
        return res;
      } else if ((top >= Math.SQRT2 / 2 || top < Math.SQRT2 / 2 && direction == "top") && (!b1.options.sides.bottom || !b2.options.sides.top)) {
        return res;
      } else if ((bottom >= Math.SQRT2 / 2 || bottom < Math.SQRT2 / 2 && direction == "bottom") && (!b1.options.sides.top || !b2.options.sides.bottom)) {
        return res;
      }
      const diff = detect.normal.clone().mult(detect.depth / (b1.inverseMass + b2.inverseMass));
      b1.position.add(diff.clone().mult(b1.inverseMass));
      b2.position.sub(diff.clone().mult(b2.inverseMass));
      const relVelDotN = Vector.dot(relVel, detect.normal);
      if (relVelDotN <= 0) {
        b1._vel.add(vel1);
        b2._vel.sub(vel2);
        b1.angularVelocity += Vector.cross(r1, vel1.clone().mult(1 / b1.inertia));
        b2.angularVelocity -= Vector.cross(r2, vel2.clone().mult(1 / b1.inertia));
        const tangent = detect.normal.clone().norm();
        const j2 = -(1 + bounce) * Vector.dot(relVel, tangent) * friction / (b1.inverseMass + b2.inverseMass + Math.pow(Vector.cross(r1, tangent), 2) / b1.inertia + Math.pow(Vector.cross(r2, tangent), 2) / b2.inertia);
        const jt = tangent.clone().mult(j2);
        const vel1a = jt.clone().mult(b1.inverseMass);
        const vel2a = jt.clone().mult(b2.inverseMass);
        b1._vel.add(vel1a.clone());
        b2._vel.sub(vel2a.clone());
        b1.angularVelocity += Vector.cross(r1, vel1a.clone().mult(1 / b1.inertia));
        b2.angularVelocity -= Vector.cross(r2, vel2a.clone().mult(1 / b2.inertia));
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
          b2.passiveVelocity = b1.velocity;
      } else if (direction == "top") {
        if (b1.followBottomObject)
          b1.passiveVelocity = b2.velocity;
      }
      return res;
    }
    return {
      collide: false
    };
  };

  // src/physics/World.js
  var World = class {
    _relaxationCount;
    _gravity;
    _quadtree;
    _bodies = [];
    _joints = [];
    constructor(params = {}) {
      this._relaxationCount = paramParser.parseValue(params.relaxationCount, 1);
      this._gravity = paramParser.parseValue(params.gravity, 0);
      const bounds = paramParser.parseValue(params.bounds, [[-1e3, -1e3], [1e3, 1e3]]);
      const cellDimension = paramParser.parseObject(params.cellDimension, { width: 100, height: 100 });
      const cellLimit = paramParser.parseValue(params.cellLimit, 10);
      this._quadtree = new QuadTree(bounds, cellLimit);
    }
    get quadtree() {
      return this._quadtree;
    }
    findNear(position, bounds) {
      return this.quadtree.findNear(position, bounds).map((c) => c.entity);
    }
    addJoint(j) {
      this._joints.push(j);
    }
    removeJoint(j) {
      const idx = this._joints.indexOf(j);
      if (idx != -1) {
        this._joints.splice(idx, 1);
      }
    }
    addBody(e, b) {
      e._body = b;
      const treeController = new QuadtreeController({
        quadtree: this._quadtree
      });
      e.addComponent(treeController);
      this._bodies.push(b);
    }
    removeBody(e, b) {
      const i = this._bodies.indexOf(b);
      if (i != -1) {
        for (let j of b._joints) {
          const other = j._body2;
          other._joints.splice(other._joints.indexOf(j), 1);
          this.removeJoint(j);
        }
        this._bodies.splice(i, 1);
      }
    }
    update(elapsedTimeS) {
      for (let body of this._bodies) {
        body._collisions.left.clear();
        body._collisions.right.clear();
        body._collisions.top.clear();
        body._collisions.bottom.clear();
        body._collisions.all.clear();
      }
      for (let body of this._bodies) {
        if (body.mass != 0) {
          body.velocity.y += this._gravity * elapsedTimeS;
        }
        body.updatePosition(elapsedTimeS);
      }
      for (let joint of this._joints) {
        joint.update(elapsedTimeS);
      }
      for (let i = 0; i < this._relaxationCount; ++i) {
        for (let body of this._bodies) {
          body.handleBehavior();
        }
      }
      this._quadtree.clear();
      for (let body of this._bodies) {
        const treeController = body.getComponent("QuadtreeController");
        treeController.updateClient();
      }
    }
  };
  var QuadtreeController = class extends Component {
    _quadtree;
    _client = null;
    constructor(params) {
      super();
      this._quadtree = params.quadtree;
    }
    initComponent() {
      const pos = [
        this._parent.body.position.x,
        this._parent.body.position.y
      ];
      const boundingRect = this._parent.body.getBoundingRect();
      this._client = this._quadtree.newClient(pos, [boundingRect.width, boundingRect.height]);
      this._client.entity = this._parent;
    }
    findNearby(rangeX, rangeY) {
      const results = this._quadtree.findNear([this._parent.position.x, this._parent.position.y], [rangeX, rangeY]);
      return results.filter((c) => c.entity != this._parent).map((c) => c.entity);
    }
    updateClient() {
      const pos = [
        this._parent.body.position.x,
        this._parent.body.position.y
      ];
      this._client.x = pos[0];
      this._client.y = pos[1];
      if (this._parent.body._resized) {
        this._parent.body._resized = false;
        const boundingRect = this._parent.body.getBoundingRect();
        this._client.w = boundingRect.width;
        this._client.h = boundingRect.height;
      }
      this._quadtree.updateClient(this._client);
    }
  };

  // src/utils/Color.js
  var _Color = class {
    _value;
    _str;
    constructor(str = "black") {
      this.set(str);
    }
    get value() {
      return this._value;
    }
    get alpha() {
      if (this._str == "transparent") {
        return 0;
      } else if (this._str.startsWith("rgba")) {
        return parseFloat(this._str.slice(5, this._str.length - 1).split(",")[3]);
      }
      return 1;
    }
    set(str) {
      this._str = str;
      this._value = _Color.parse(str);
    }
    copy(col) {
      this._str = col._str;
      this._value = col._value;
    }
    static parse(str) {
      const ctx = _Color._buffer;
      if (typeof str != "string") {
        return "black";
      }
      const params = str.split(";");
      const len = params.length;
      if (len === 1) {
        return str;
      }
      let grd;
      const values = params[1].split(",").map((val) => parseFloat(val));
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
      for (let i = 2; i < len; ++i) {
        const colorValuePair = params[i].split("=");
        grd.addColorStop(parseFloat(colorValuePair[1]), colorValuePair[0]);
      }
      return grd;
    }
  };
  var Color = _Color;
  __publicField(Color, "_buffer", document.createElement("canvas").getContext("2d"));

  // src/utils/Shaker.js
  var Shaker = class {
    _offset = new Vector();
    _anim = null;
    get offset() {
      return this._offset;
    }
    shake(range, dur, freq, angle) {
      const count = freq * dur / 1e3;
      this._anim = {
        counter: 0,
        count,
        angle,
        dur,
        range
      };
    }
    isShaking() {
      return this._anim !== null;
    }
    stopShaking() {
      this._anim = null;
      this._offset.set(0, 0);
    }
    update(elapsedTimeS) {
      if (this._anim) {
        const anim = this._anim;
        anim.counter += elapsedTimeS * 1e3;
        const progress = math.sat(anim.counter / anim.dur);
        this._offset.copy(new Vector(Math.sin(progress * Math.PI * 2 * anim.count) * anim.range, 0).rot(anim.angle));
        if (progress == 1) {
          this.stopShaking();
        }
      }
    }
  };

  // src/core/Entity.js
  var Entity = class {
    _name = null;
    _scene = null;
    _parent = null;
    _groupList = new Set();
    _components = new Map();
    _position = new PositionManager();
    _interactive = null;
    _body = null;
    _onUpdate = null;
    get name() {
      return this._name;
    }
    get scene() {
      return this._scene;
    }
    get position() {
      return this._position.position;
    }
    set position(v) {
      this._position.position = v;
    }
    get interactive() {
      return this._interactive;
    }
    get body() {
      return this._body;
    }
    get groupList() {
      return this._groupList;
    }
    constructor(scene, n) {
      scene.addEntity(this, n);
    }
    clip(e, fixed = false) {
      this._position.clip(e._position, fixed);
    }
    unclip(e) {
      this._position.unclip(e._position);
    }
    moveTo(v, dur, timing = "linear", onEnd = null) {
      this._position.moveTo(v, dur, timing, onEnd);
    }
    moveBy(v, dur, timing = "linear", onEnd = null) {
      this._position.moveBy(v, dur, timing, onEnd);
    }
    stopMoving() {
      this._position.stopMoving();
    }
    isMoving() {
      return this._position.isMoving();
    }
    addComponent(c, n) {
      if (n === void 0) {
        n = c.constructor.name;
      }
      this._components.set(n, c);
      c._parent = this;
      c.position.copy(this.position.clone().add(c.offset));
      this.clip(c, true);
      c.initComponent();
    }
    getComponent(n) {
      return this._components.get(n);
    }
    _updatePosition(elapsedTimeS) {
      this._position.update(elapsedTimeS);
    }
    remove() {
      this._scene.removeEntity(this);
    }
    update(elapsedTimeS) {
      this._updatePosition(elapsedTimeS);
      if (this._onUpdate) {
        this._onUpdate(elapsedTimeS);
      }
      this._components.forEach((c) => {
        c.update(elapsedTimeS);
      });
    }
    onUpdate(callback) {
      this._onUpdate = callback;
    }
  };

  // src/core/Camera.js
  var Camera = class extends Entity {
    _scale = new Animator(1);
    _target = null;
    _t = 4;
    _vel = new Vector();
    _shaker = new Shaker();
    constructor(scene, n) {
      super(scene, n);
    }
    get position() {
      return this._position.position;
    }
    get scale() {
      return this._scale.value;
    }
    set scale(n) {
      if (n > 0) {
        this._scale.value = n;
      }
    }
    get velocity() {
      return this._vel;
    }
    set velocity(v) {
      this._vel.copy(v);
    }
    get shaker() {
      return this._shaker;
    }
    follow(target, t = 4) {
      this._target = target;
      this._t = t;
    }
    unfollow() {
      this._target = null;
    }
    isScaling() {
      return this._scale.isAnimating();
    }
    scaleTo(n, dur, timing = "linear", onEnd = null) {
      this._scale.animate(n, dur, timing, onEnd);
    }
    stopScaling() {
      this._scale.stopAnimating();
    }
    moveAndScale(v, n, dur, timing = "linear", onEnd = null) {
      this.moveTo(v, dur, timing, onEnd);
      this.scaleTo(n, dur, timing);
    }
    stop() {
      this.stopMoving();
      this.stopScaling();
    }
    _updatePosition(elapsedTimeS) {
      if (this.isMoving()) {
        this._position.update(elapsedTimeS);
      } else if (this._target != null) {
        let t = math.sat(this._t * elapsedTimeS * 60);
        this.position.lerp(this._target.position, t);
      } else {
        const vel = this._vel.clone();
        vel.mult(elapsedTimeS);
        this.position.add(vel);
      }
      this._scale.update(elapsedTimeS);
      this._shaker.update(elapsedTimeS);
    }
  };

  // src/core/EntityManager.js
  var EntityManager = class {
    _entities = [];
    _entitiesMap = new Map();
    _ids = 0;
    add(e, n) {
      if (n === void 0) {
        n = this._generateName();
      }
      this._entities.push(e);
      this._entitiesMap.set(n, e);
      e._parent = this;
      e._name = n;
    }
    get(n) {
      return this._entitiesMap.get(n);
    }
    remove(e) {
      const i = this._entities.indexOf(e);
      if (i < 0) {
        return;
      }
      this._entities.splice(i, 1);
    }
    filter(cb) {
      return this._entities.filter(cb);
    }
    update(elapsedTimeS) {
      for (let e of this._entities) {
        e.update(elapsedTimeS);
      }
    }
    _generateName() {
      ++this._ids;
      return "__entity__" + this._ids;
    }
  };

  // src/core/Scene.js
  var Scene = class {
    _paused = true;
    _hidden = true;
    _world;
    _drawable = [];
    _interactiveEntities = [];
    _keys = new Set();
    _entityManager = new EntityManager();
    _buffer = null;
    _background;
    _timeout = new TimeoutHandler();
    _camera;
    _interactive = new Interactive();
    _game = null;
    debug = false;
    _drawCounter = 0;
    constructor(game, name, zIndex, options = {}) {
      this._game = game;
      this._game._sceneManager.add(this, name, zIndex);
      this._world = new World(options.world);
      this._background = new Color(paramParser.parseValue(options.background, options.background));
      this._camera = new Camera(this, "Camera");
    }
    get paused() {
      return this._paused;
    }
    get hidden() {
      return this._hidden;
    }
    get timeout() {
      return this._timeout;
    }
    get camera() {
      return this._camera;
    }
    get world() {
      return this._world;
    }
    get resources() {
      return this._game.resources;
    }
    get audio() {
      return this._game.audio;
    }
    get background() {
      return this._background;
    }
    set background(col) {
      this._background.copy(col);
    }
    get game() {
      return this._game;
    }
    get interactive() {
      return this._interactive;
    }
    isKeyPressed(key) {
      return this._keys.has(key);
    }
    setInteractive(entity) {
      this._interactiveEntities.push(entity);
      const interactive = new Interactive();
      entity.addComponent(interactive);
      entity._interactive = interactive;
    }
    getEntityByName(n) {
      return this._entityManager.get(n);
    }
    getEntitiesByGroup(g) {
      return this._entityManager.filter((e) => e.groupList.has(g));
    }
    handleEvent(type, event) {
      if (this.paused) {
        return false;
      }
      let captured = false;
      if (type.startsWith("mouse")) {
        if (type == "mousedown") {
          const entities = this.world.findNear([event.x, event.y], [0, 0]);
          for (let e of entities) {
            if (!e.interactive) {
              continue;
            }
            if (e.body.contains(new Vector(event.x, event.y))) {
              e.interactive._id = event.id;
              if (e.interactive.handleEvent(type, event)) {
                captured = true;
              }
            }
          }
        } else {
          for (let e of this._interactiveEntities) {
            if (event.id != -1 && e.interactive._id == event.id) {
              if (e.interactive.handleEvent(type, event)) {
                captured = true;
              }
              if (type == "mouseup") {
                e.interactive._id = -1;
              }
            }
          }
        }
      } else if (type.startsWith("key")) {
        switch (type) {
          case "keydown":
            this._keys.add(event.key);
            break;
          case "keyup":
            this._keys.delete(event.key);
            break;
        }
      }
      if (!captured) {
        if (this._interactive.handleEvent(type, event)) {
          captured = true;
        }
      }
      return captured;
    }
    create(n) {
      const e = new Entity(this, n);
      return e;
    }
    addEntity(e, n) {
      e._scene = this;
      this._entityManager.add(e, n);
    }
    removeEntity(e) {
      this._entityManager.remove(e);
      e._components.forEach((c) => {
        switch (c._type) {
          case "drawable":
            this.removeDrawable(c);
            break;
          case "body":
            this.removeBody(e, c);
            break;
          case "light":
            this.removeLight(c);
            break;
          case "interactive":
            this._interactiveEntities.splice(this._interactiveEntities.indexOf(e), 1);
            break;
        }
      });
    }
    addDrawable(c) {
      this._drawable.push(c);
      for (let i = this._drawable.length - 1; i > 0; --i) {
        if (c._zIndex >= this._drawable[i - 1]._zIndex) {
          break;
        }
        [this._drawable[i], this._drawable[i - 1]] = [this._drawable[i - 1], this._drawable[i]];
      }
    }
    removeDrawable(c) {
      const i = this._drawable.indexOf(c);
      if (i != -1) {
        this._drawable.splice(i, 1);
      }
    }
    addBody(e, b) {
      this._world.addBody(e, b);
    }
    removeBody(e, b) {
      this._world.removeBody(e, b);
    }
    hide() {
      this._paused = true;
      this._hidden = true;
    }
    show() {
      this._hidden = false;
    }
    pause() {
      this._paused = true;
    }
    play() {
      this._paused = false;
      this._hidden = false;
    }
    update(_) {
    }
    _update(elapsedTimeS) {
      if (this._paused) {
        return;
      }
      this.timeout.update(elapsedTimeS * 1e3);
      this._entityManager.update(elapsedTimeS);
      this.update(elapsedTimeS);
      this._world.update(elapsedTimeS);
    }
    render(w, h, q) {
      const cam = this._camera;
      const camPos = cam.position.clone().add(cam.shaker.offset);
      const camScale = cam.scale * q / 1;
      if (!this._buffer) {
        this._buffer = document.createElement("canvas").getContext("2d");
        this._buffer.canvas.width = w;
        this._buffer.canvas.height = h;
        this._buffer.imageSmoothingEnabled = false;
      }
      const buffer = this._buffer;
      buffer.beginPath();
      buffer.clearRect(0, 0, w, h);
      buffer.fillStyle = this.background.value;
      buffer.fillRect(0, 0, w, h);
      buffer.save();
      buffer.translate(Math.floor(-camPos.x * camScale + w / 2 + 0.5), Math.floor(-camPos.y * camScale + h / 2 + 0.5));
      buffer.scale(camScale, camScale);
      this._drawCounter = 0;
      for (let elem of this._drawable) {
        const boundingBox = elem.getBoundingBox();
        const pos = new Vector(boundingBox.x, boundingBox.y);
        pos.sub(camPos);
        pos.mult(cam.scale);
        const [width, height] = [boundingBox.width, boundingBox.height].map((_) => _ * cam.scale);
        if (pos.x + width / 2 < -w / 2 / q || pos.x - width / 2 > w / 2 / q || pos.y + height / 2 < -h / 2 / q || pos.y - height / 2 > h / 2 / q) {
          continue;
        }
        ++this._drawCounter;
        elem.drawInternal(buffer);
      }
      if (this.debug) {
        this.world.quadtree.draw(buffer);
        for (let body of this.world._bodies) {
          body.draw(buffer);
        }
      }
      buffer.restore();
      this._drawDebugInfo(buffer, w, h);
    }
    draw(ctx, w, h, q) {
      if (!this._buffer) {
        this.render(w, h, q);
      }
      ctx.drawImage(this._buffer.canvas, 0, 0, w, h);
    }
    _drawDebugInfo(ctx, w, h) {
      if (!this.debug) {
        return;
      }
      const left = 0, top = 0, minWidth = Math.max(w * 0.4, 200), minHeight = Math.max(w * 0.2, 100), margin = Math.max(w * 0.01, 4), fontSize = Math.max(w * 0.025, 12), padding = Math.max(w * 5e-3, 2), color = "white", background = "rgba(128,128,128,0.5)";
      let info = [
        `Paused: ${this._paused}`,
        `FPS: ${this._game._engine._fpsMeter.fps}`,
        `Keys pressed: ${Array.from(this._keys).join(",")}`,
        `Entities: ${this._entityManager._entities.length}`,
        `Bodies: ${this._world._bodies.length}`,
        `${this._drawCounter} objects drawn of total ${this._drawable.length}`,
        `Camera: x = ${this.camera.position.x.toFixed(2)}, y = ${this.camera.position.y.toFixed(2)}, z = ${this.camera.scale.toFixed(2)}`
      ];
      ctx.beginPath();
      ctx.font = fontSize + "px Arial";
      ctx.fillStyle = background;
      ctx.fillRect(left, top, Math.max(Math.max(...info.map((e) => ctx.measureText(e).width)) + margin * 2, minWidth), Math.max(info.length * (fontSize + padding) + margin * 2, minHeight));
      ctx.textBaseline = "top";
      ctx.fillStyle = color;
      for (let i = 0; i < info.length; ++i) {
        ctx.fillText(info[i], left + margin, top + margin + i * (fontSize + padding));
      }
    }
  };

  // src/utils/AudioManager.js
  var AudioManager = class {
    _resources;
    _bgmusic;
    _effects;
    constructor(resources) {
      this._resources = resources;
      this._effects = new Effects(this._resources);
      this._music = new Music(this._resources);
    }
    get music() {
      return this._music;
    }
    get effects() {
      return this._effects;
    }
  };
  var Music = class {
    _resources;
    _paused = true;
    _audio = null;
    _volume = 1;
    _speed = 1;
    _loop = false;
    constructor(resources) {
      this._resources = resources;
    }
    get volume() {
      return this._volume;
    }
    set volume(val) {
      this._volume = math.sat(val);
      this._set();
    }
    get speed() {
      return this._speed;
    }
    set speed(val) {
      if (val > 0) {
        this._speed = val;
        this._set();
      }
    }
    get loop() {
      return this._loop;
    }
    set loop(val) {
      this._loop = val;
      this._set();
    }
    get time() {
      return this._audio ? this._audio.currentTime : 0;
    }
    set time(val) {
      if (this._audio) {
        this._audio.currentTime = math.clamp(val, 0, this._audio.duration);
      }
    }
    get paused() {
      return this._paused;
    }
    set(name) {
      if (!this._paused) {
        this._audio.pause();
      }
      this._audio = this._resources.get(name).cloneNode(true);
      this._set();
      if (!this._paused) {
        this.play();
      }
    }
    play() {
      this._paused = false;
      if (this._audio) {
        const promise = this._audio.play();
        if (promise) {
          promise.then((_) => {
          }).catch((err) => console.log("fuck"));
        }
      }
    }
    pause() {
      this._paused = true;
      if (this._audio) {
        try {
          this._audio.pause();
        } catch (e) {
          console.log(e);
        }
      }
    }
    _set() {
      if (this._audio) {
        this._audio.volume = this._volume;
        this._audio.playbackRate = this._speed;
        this._audio.loop = this._loop;
      }
    }
  };
  var Effects = class {
    _resources;
    _volume = 1;
    _arr = [];
    constructor(resources) {
      this._resources = resources;
    }
    get volume() {
      return this._volume;
    }
    set volume(val) {
      this._volume = math.sat(val);
      for (let audio of this._arr) {
        audio.volume = this._volume;
      }
    }
    play(name, params = {}) {
      const speed = paramParser.parseValue(params.speed, 1);
      const audioElem = this._resources.get(name).cloneNode(true);
      audioElem.addEventListener("ended", () => {
        const idx = this._arr.indexOf(audioElem);
        if (idx != -1) {
          this._arr.splice(idx, 1);
        }
      });
      audioElem.volume = this._volume;
      audioElem.playbackRate = speed;
      this._arr.push(audioElem);
      const promise = audioElem.play();
      if (promise) {
        promise.then((_) => {
        }).catch((err) => console.log("fuck"));
      }
    }
  };

  // src/core/Game.js
  var Game = class {
    _resources = null;
    _config;
    _width;
    _height;
    _init;
    _preload;
    _parentElement;
    _renderer;
    _load = new Loader();
    _sceneManager = new SceneManager();
    _engine;
    _timeout = new TimeoutHandler();
    _audio = null;
    _quality;
    constructor(config) {
      this._config = config;
      this._width = config.width;
      this._height = config.height;
      this._quality = paramParser.parseValue(config.quality, 1);
      this._init = config.init.bind(this);
      let preload;
      if ((preload = paramParser.parseValue(config.preload, null)) !== null) {
        this._preload = preload.bind(this);
      }
      this._parentElement = paramParser.parseValue(config.parentElement, document.body);
      const elem = this._parentElement;
      elem.style.WebkitUserSelect = "none";
      elem.style.userSelect = "none";
      elem.style.touchAction = "none";
      elem.style.overflow = "hidden";
      this._renderer = new Renderer(this._width, this._height, this._quality, this._parentElement);
      const step = (elapsedTime) => {
        this._timeout.update(elapsedTime);
        const scenes = this._sceneManager.scenes;
        for (let scene of scenes) {
          scene._update(elapsedTime * 1e-3);
        }
        this._renderer.render(scenes);
      };
      this._engine = new Engine(step);
      this._initEventListeners();
      this._initControls();
      this._engine.start();
      if (this._preload) {
        this._preload();
        this._load.load((data) => {
          this._resources = data;
          this._audio = new AudioManager(this._resources);
          this._init();
        });
      } else {
        this._init();
      }
    }
    get width() {
      return this._width;
    }
    get height() {
      return this._height;
    }
    get load() {
      return this._load;
    }
    get resources() {
      return this._resources;
    }
    get timeout() {
      return this._timeout;
    }
    get audio() {
      return this._audio;
    }
    get quality() {
      return this._quality;
    }
    set quality(val) {
      this._quality = val;
      this._renderer._quality = this._quality;
      this._renderer._canvas.remove();
      this._renderer._initCanvas();
      for (let scene of this._sceneManager.scenes) {
        scene._buffer = null;
      }
    }
    get(n) {
      const scene = this._sceneManager.get(n);
      if (!scene) {
        return null;
      }
      return scene;
    }
    requestFullScreen() {
      try {
        const elem = this._parentElement;
        let requestMethod = elem.requestFullScreen || elem.webkitRequestFullScreen || elem.mozRequestFullScreen;
        if (requestMethod) {
          requestMethod.call(elem);
        }
      } catch (e) {
        console.log(e);
      }
    }
    _initEventListeners() {
      const isTouchDevice = "ontouchstart" in document;
      const con = this._renderer._container;
      if (isTouchDevice) {
        con.addEventListener("touchstart", (e) => this._handleTouchEvent(e));
        con.addEventListener("touchmove", (e) => this._handleTouchEvent(e));
        con.addEventListener("touchend", (e) => this._handleTouchEvent(e));
      } else {
        con.addEventListener("mousedown", (e) => this._handleMouseEvent(e));
        con.addEventListener("mousemove", (e) => this._handleMouseEvent(e));
        con.addEventListener("mouseup", (e) => this._handleMouseEvent(e));
      }
      addEventListener("keydown", (e) => this._handleKeyEvent(e));
      addEventListener("keyup", (e) => this._handleKeyEvent(e));
    }
    _handleKeyEvent(e) {
      e.preventDefault();
      this._handleSceneEvent(e.type, {
        key: e.key
      });
    }
    _handleTouchEvent(e) {
      e.preventDefault();
      const touchToMouseType = {
        "touchstart": "mousedown",
        "touchmove": "mousemove",
        "touchend": "mouseup"
      };
      for (let i = 0; i < e.changedTouches.length; ++i) {
        this._handleSceneEvent(touchToMouseType[e.type], {
          x: e.changedTouches[i].pageX,
          y: e.changedTouches[i].pageY,
          id: e.changedTouches[i].identifier
        });
      }
    }
    _handleMouseEvent(e) {
      e.preventDefault();
      this._handleSceneEvent(e.type, {
        x: e.pageX,
        y: e.pageY,
        id: 0
      });
    }
    _handleSceneEvent(type, params) {
      for (let scene of this._sceneManager.scenes) {
        let paramsCopy = Object.assign({}, params);
        if (type.startsWith("mouse")) {
          const coords = this._renderer.displayToSceneCoords(scene, paramsCopy.x, paramsCopy.y);
          paramsCopy.x = coords.x;
          paramsCopy.y = coords.y;
        }
        if (scene.handleEvent(type, paramsCopy, this._renderer)) {
          break;
        }
      }
    }
    _initControls() {
      const controls = paramParser.parseObject(this._config.controls, {
        active: false,
        joystick: false,
        theme: "dark",
        layout: {
          DPad: { left: "ArrowLeft", right: "ArrowRight", up: "ArrowUp", down: "ArrowDown" },
          X_Button: "e",
          Y_Button: "d",
          A_Button: "s",
          B_Button: "f",
          L_Button: "Control",
          R_Button: "Control",
          START_Button: " ",
          SELECT_Button: "Tab"
        }
      });
      if (!controls.active || !("ontouchstart" in document)) {
        return;
      }
      let color, color2;
      switch (controls.theme) {
        case "light":
          color = "black";
          color2 = "white";
          break;
        default:
          color = "white";
          color2 = "black";
      }
      const layout = controls.layout;
      const applyStyle = (elem, bg = true) => {
        elem.style.pointerEvents = "auto";
        elem.style.position = "absolute";
        elem.style.border = "2px solid " + color;
        elem.style.color = color;
        elem.style.fontFamily = "Arial";
        elem.style.display = "flex";
        elem.style.alignItems = "center";
        elem.style.justifyContent = "center";
        if (bg) {
          elem.style.background = color2;
        }
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
      controlsContainer.style.left = "0";
      controlsContainer.style.top = "0";
      controlsContainer.style.zIndex = "999";
      controlsContainer.style.position = "fixed";
      controlsContainer.style.pointerEvents = "none";
      const controlsMap = {};
      const dpad = document.createElement("div");
      dpad.style.width = "120px";
      dpad.style.height = "120px";
      dpad.style.left = "15px";
      dpad.style.bottom = "50px";
      dpad.style.borderRadius = "50%";
      dpad.style.overflow = "hidden";
      applyStyle(dpad);
      controlsContainer.appendChild(dpad);
      for (let i = 0; i < 4; ++i) {
        const box = document.createElement("div");
        box.style.width = "120px";
        box.style.height = "120px";
        box.style.left = -75 + 150 * (i % 2) + "px";
        box.style.top = -75 + 150 * Math.floor(i / 2) + "px";
        applyStyle(box, false);
        dpad.appendChild(box);
      }
      const joystick = document.createElement("div");
      joystick.style.width = "120px";
      joystick.style.height = "120px";
      joystick.style.right = "15px";
      joystick.style.bottom = "50px";
      joystick.style.borderRadius = "50%";
      applyStyle(joystick);
      controlsContainer.appendChild(joystick);
      let joystickId = -1, dpadId = -1;
      const joystickPad = document.createElement("div");
      joystickPad.style.width = "60px";
      joystickPad.style.height = "60px";
      joystickPad.style.left = "0";
      joystickPad.style.top = "0";
      joystickPad.style.borderRadius = "50%";
      applyStyle(joystickPad);
      joystick.appendChild(joystickPad);
      joystickPad.style.display = "none";
      const handleJoystick = (type, x, y) => {
        const boundingRect = joystick.getBoundingClientRect();
        x = x - (boundingRect.x + boundingRect.width / 2);
        y = y - (boundingRect.y + boundingRect.height / 2);
        const v = new Vector(x, y);
        if (v.mag() > 60) {
          v.unit().mult(60);
        }
        joystickPad.style.left = v.x + boundingRect.width / 4 + "px";
        joystickPad.style.top = v.y + boundingRect.height / 4 + "px";
        const con = this._renderer._container.getBoundingClientRect();
        this._handleSceneEvent(type, { x: x + con.x + con.width / 2, y: y + con.y + con.height / 2, id: -1 });
      };
      joystick.addEventListener("touchstart", (e) => {
        e.preventDefault();
        handleJoystick("mousedown", e.changedTouches[0].pageX, e.changedTouches[0].pageY);
        joystickId = e.changedTouches[0].identifier;
        joystickPad.style.display = "block";
      });
      joystick.addEventListener("touchmove", (e) => {
        e.preventDefault();
        for (let i = 0; i < e.changedTouches.length; ++i) {
          if (e.changedTouches[i].identifier == joystickId) {
            handleJoystick("mousemove", e.changedTouches[i].pageX, e.changedTouches[i].pageY);
            break;
          }
        }
      });
      joystick.addEventListener("touchend", (e) => {
        e.preventDefault();
        for (let i = 0; i < e.changedTouches.length; ++i) {
          if (e.changedTouches[i].identifier == joystickId) {
            handleJoystick("mouseup", e.changedTouches[i].pageX, e.changedTouches[i].pageY);
            joystickId = -1;
            joystickPad.style.display = "none";
            break;
          }
        }
      });
      controlsMap.DPad = dpad;
      controlsMap.A_Button = createButton(10, 63, "A");
      controlsMap.B_Button = createButton(63, 10, "B");
      controlsMap.X_Button = createButton(63, 116, "X");
      controlsMap.Y_Button = createButton(116, 63, "Y");
      controlsMap.L_Button = createSideButton("left");
      controlsMap.R_Button = createSideButton("right");
      controlsMap.SELECT_Button = createActionButton("Select", -20);
      controlsMap.START_Button = createActionButton("Start", 20);
      this._parentElement.appendChild(controlsContainer);
      const directions = {
        left: { v: new Vector(-1, 0), n: "left" },
        right: { v: new Vector(1, 0), n: "right" },
        up: { v: new Vector(0, -1), n: "up" },
        down: { v: new Vector(0, 1), n: "down" }
      };
      const getDPadDirection = (x, y) => {
        const boundingRect = dpad.getBoundingClientRect();
        x = x - (boundingRect.x + boundingRect.width / 2);
        y = y - (boundingRect.y + boundingRect.height / 2);
        const pos = new Vector(x, y);
        if (pos.mag() < 20)
          return [];
        const n = pos.clone().unit();
        const res = [];
        if (Vector.dot(n, directions.left.v) >= 0.5) {
          res.push(directions.left.n);
        }
        if (Vector.dot(n, directions.right.v) >= 0.5) {
          res.push(directions.right.n);
        }
        if (Vector.dot(n, directions.up.v) >= 0.5) {
          res.push(directions.up.n);
        }
        if (Vector.dot(n, directions.down.v) >= 0.5) {
          res.push(directions.down.n);
        }
        return res;
      };
      const handleDPad = (ev, dirs, keys) => {
        for (let dir of dirs) {
          this._handleSceneEvent(ev, {
            key: keys[dir]
          });
        }
      };
      for (let attr in controlsMap) {
        const elem = controlsMap[attr];
        const key = layout[attr];
        if (attr == "DPad") {
          elem.addEventListener("touchstart", (e) => {
            e.preventDefault();
            const dirs = getDPadDirection(e.changedTouches[0].pageX, e.changedTouches[0].pageY);
            dpadId = e.changedTouches[0].identifier;
            handleDPad("keydown", dirs, key);
          });
          elem.addEventListener("touchmove", (e) => {
            e.preventDefault();
            for (let i = 0; i < e.changedTouches.length; ++i) {
              if (e.changedTouches[i].identifier == dpadId) {
                handleDPad("keyup", ["left", "right", "up", "down"], key);
                const dirs = getDPadDirection(e.changedTouches[i].pageX, e.changedTouches[i].pageY);
                handleDPad("keydown", dirs, key);
              }
            }
          });
          elem.addEventListener("touchend", (e) => {
            e.preventDefault();
            for (let i = 0; i < e.changedTouches.length; ++i) {
              if (e.changedTouches[i].identifier == dpadId) {
                dpadId = -1;
                handleDPad("keyup", ["left", "right", "up", "down"], key);
              }
            }
          });
          continue;
        }
        elem.addEventListener("touchstart", (e) => {
          e.preventDefault();
          this._handleSceneEvent("keydown", {
            key
          });
        });
        elem.addEventListener("touchmove", (e) => {
          e.preventDefault();
          this._handleSceneEvent("keydown", {
            key
          });
        });
        elem.addEventListener("touchend", (e) => {
          e.preventDefault();
          this._handleSceneEvent("keyup", {
            key
          });
        });
      }
      if (controls.joystick) {
        controlsMap.X_Button.style.display = "none";
        controlsMap.Y_Button.style.display = "none";
        controlsMap.A_Button.style.display = "none";
        controlsMap.B_Button.style.display = "none";
      } else {
        joystick.style.display = "none";
      }
    }
  };

  // src/utils/_index.js
  var index_exports = {};
  __export(index_exports, {
    Color: () => Color,
    LevelMaker: () => LevelMaker,
    Loader: () => Loader,
    QuadTree: () => QuadTree,
    Tileset: () => Tileset,
    TimeoutHandler: () => TimeoutHandler,
    Vector: () => Vector,
    math: () => math,
    paramParser: () => paramParser
  });

  // src/drawable/Drawable.js
  var Drawable = class extends Component {
    _zIndex;
    _opacity;
    _fillColor;
    _strokeColor;
    _strokeWidth;
    _visible = true;
    constructor(params = {}) {
      super();
      this._type = "drawable";
      this._zIndex = paramParser.parseValue(params.zIndex, 0);
      this._opacity = new Animator(paramParser.parseValue(params.opacity, 1));
      this._fillColor = new Color(paramParser.parseValue(params.fillColor, "white"));
      this._strokeColor = new Color(params.strokeColor);
      this._strokeWidth = paramParser.parseValue(params.strokeWidth, 1);
      this._strokeCap = paramParser.parseValue(params.strokeCap, "butt");
      this._shadowColor = new Color(paramParser.parseValue(params.shadowColor, "transparent"));
      this._shadow = paramParser.parseObject(params.shadow, {
        x: 0,
        y: 0
      });
    }
    get visible() {
      return this._visible;
    }
    set visible(val) {
      this._visible = val;
    }
    get zIndex() {
      return this._zIndex;
    }
    set zIndex(val) {
      this._zIndex = val;
      if (this.scene) {
        this.scene.removeDrawable(this);
        this.scene.addDrawable(this);
      }
    }
    get opacity() {
      return this._opacity.value;
    }
    set opacity(val) {
      this._opacity.value = math.sat(val);
    }
    get strokeWidth() {
      return this._strokeWidth;
    }
    set strokeWidth(val) {
      this._strokeWidth = Math.max(val, 0);
    }
    get fillColor() {
      return this._fillColor;
    }
    set fillColor(col) {
      this._fillColor.copy(col);
    }
    get shadowColor() {
      return this._shadowColor;
    }
    set shadowColor(col) {
      this._shadowColor.copy(col);
    }
    get shadow() {
      return this._shadow;
    }
    get strokeColor() {
      return this._strokeColor;
    }
    set strokeColor(col) {
      this._strokeColor.copy(col);
    }
    fade(val, dur, timing = "linear", onEnd = null) {
      this._opacity.animate(val, dur, timing, onEnd);
    }
    getBoundingBox() {
      return {
        x: 0,
        y: 0,
        width: 0,
        height: 0
      };
    }
    initComponent() {
      this.scene.addDrawable(this);
    }
    drawInternal(ctx) {
      if (!this.visible) {
        return;
      }
      ctx.save();
      if (this.shadowColor != "transparent" && (this.shadow.x != 0 || this.shadow.y != 0)) {
        ctx.save();
        ctx.translate(this.shadow.x, this.shadow.y);
        this.drawShadow(ctx);
        ctx.restore();
      }
      this.draw(ctx);
      ctx.restore();
    }
    draw(_) {
    }
    drawShadow(_) {
    }
    update(elapsedTimeS) {
      this._opacity.update(elapsedTimeS);
    }
  };
  var FixedDrawable = class extends Drawable {
    _flip;
    _scale;
    _image = null;
    _imageOptions = null;
    _center = new Vector();
    _width;
    _height;
    _imageParams = null;
    _shaker = new Shaker();
    constructor(params = {}) {
      super(params);
      this._imageParams = paramParser.parseValue(params.image, null);
      const scale = paramParser.parseObject(params.scale, { x: 1, y: 1 });
      this._scale = { x: new Animator(scale.x), y: new Animator(scale.y) };
      this._width = paramParser.parseValue(params.width, 0);
      this._height = paramParser.parseValue(params.height, 0);
    }
    get width() {
      return this._width;
    }
    set width(num) {
      this._width = Math.max(num, 0);
    }
    get height() {
      return this._height;
    }
    set height(num) {
      this._height = Math.max(num, 0);
    }
    get scale() {
      return {
        x: this._scale.x.value,
        y: this._scale.y.value
      };
    }
    get image() {
      return this._imageOptions;
    }
    set scale(param) {
      const obj = paramParser.parseObject(param, { x: this._scale.x.value, y: this._scale.y.value });
      this._scale.x.value = obj.x;
      this._scale.y.value = obj.y;
    }
    get center() {
      return this._center;
    }
    set center(v) {
      this._center.copy(v);
    }
    get shaker() {
      return this._shaker;
    }
    scaleTo(param, dur, timing = "linear", onEnd = null) {
      const obj = paramParser.parseObject(param, { x: this._scale.x.value, y: this._scale.y.value });
      if (this._scale.x.value != obj.x) {
        this._scale.x.animate(obj.x, dur, timing, onEnd);
      }
      if (this._scale.y.value != obj.y) {
        this._scale.y.animate(obj.y, dur, timing, onEnd);
      }
    }
    initComponent() {
      super.initComponent();
      if (this._imageParams !== null) {
        this._image = this.scene.resources.get(this._imageParams.name);
        this._imageOptions = paramParser.parseObject(this._imageParams, {
          width: this._image.width,
          height: this._image.height,
          frameWidth: this._image.width,
          frameHeight: this._image.height,
          framePosition: { x: 0, y: 0 }
        });
      }
    }
    getBoundingBox() {
      const d = Math.hypot(this._width, this._height);
      return {
        width: d * Math.abs(this.scale.x),
        height: d * Math.abs(this.scale.y),
        x: this.position.x - this._center.x * Math.abs(this.scale.x),
        y: this.position.y - this._center.y * Math.abs(this.scale.y)
      };
    }
    drawInternal(ctx) {
      if (!this.visible) {
        return;
      }
      ctx.save();
      ctx.translate(this.position.x + this._shaker.offset.x, this.position.y + this._shaker.offset.y);
      if (this.shadowColor != "transparent" && (this.shadow.x != 0 || this.shadow.y != 0)) {
        ctx.save();
        ctx.translate(this.shadow.x, this.shadow.y);
        ctx.scale(this.scale.x, this.scale.y);
        ctx.rotate(this.angle);
        ctx.translate(-this._center.x, -this._center.y);
        this.drawShadow(ctx);
        ctx.restore();
      }
      ctx.scale(this.scale.x, this.scale.y);
      ctx.rotate(this.angle);
      ctx.translate(-this._center.x, -this._center.y);
      this.draw(ctx);
      ctx.restore();
    }
    drawImage(ctx, params = {}) {
      if (this._image == null) {
        return;
      }
      let options = paramParser.parseObject(params, {
        clip: true,
        framePosition: this._imageOptions.framePosition,
        width: this._imageOptions.width,
        height: this._imageOptions.height
      });
      if (options.clip) {
        ctx.clip();
      }
      ctx.drawImage(this._image, options.framePosition.x * this._imageOptions.frameWidth, options.framePosition.y * this._imageOptions.frameHeight, this._imageOptions.frameWidth, this._imageOptions.frameHeight, -options.width / 2, -options.height / 2, options.width, options.height);
    }
    update(elapsedTimeS) {
      super.update(elapsedTimeS);
      this._scale.x.update(elapsedTimeS);
      this._scale.y.update(elapsedTimeS);
      this._shaker.update(elapsedTimeS);
      this._angle.update(elapsedTimeS);
    }
    followBody() {
      let body = this.parent.body;
      if (!body) {
        return;
      }
      this.parent.addComponent(new BodyFollower({
        target: this
      }));
    }
    setSize(w, h) {
      this._width = w;
      this._height = h;
    }
  };
  var BodyFollower = class extends Component {
    constructor(params) {
      super();
      this._target = params.target;
    }
    update(_) {
      const body = this.parent.body;
      this._target.angle = body.angle;
    }
  };

  // src/drawable/Picture.js
  var Picture = class extends FixedDrawable {
    constructor(params) {
      super(params);
    }
    draw(ctx) {
      ctx.globalAlpha = this.opacity;
      this.drawImage(ctx, {
        clip: false,
        width: this._width,
        height: this._height
      });
    }
    drawShadow(ctx) {
      ctx.fillStyle = this.shadowColor.value;
      ctx.beginPath();
      ctx.rect(-this._width / 2, -this._height / 2, this._width, this._height);
      ctx.fill();
    }
  };

  // src/drawable/Sprite.js
  var Sprite = class extends FixedDrawable {
    _anims = new Map();
    _currentAnim = null;
    _paused = true;
    _framePos = { x: 0, y: 0 };
    constructor(params) {
      super(params);
    }
    get currentAnim() {
      if (this._currentAnim) {
        return this._currentAnim.name;
      }
      return null;
    }
    addAnim(n, frames) {
      this._anims.set(n, frames);
    }
    play(n, rate, repeat, onEnd) {
      if (n == void 0) {
        if (this._currentAnim) {
          this._paused = false;
        }
        return;
      }
      if (this.currentAnim == n) {
        return;
      }
      this._paused = false;
      const currentAnim = {
        name: n,
        rate,
        repeat,
        OnEnd: onEnd,
        frame: 0,
        counter: 0
      };
      this._currentAnim = currentAnim;
      this._framePos = this._anims.get(currentAnim.name)[currentAnim.frame];
    }
    reset() {
      if (this._currentAnim) {
        this._currentAnim.frame = 0;
        this._currentAnim.counter = 0;
      }
    }
    pause() {
      this._paused = true;
    }
    update(timeElapsedS) {
      super.update(timeElapsedS);
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
          if (currentAnim.OnEnd) {
            currentAnim.onEnd();
          }
          if (!currentAnim.repeat) {
            this._currentAnim = null;
            this._paused = true;
          } else {
            currentAnim.frame = 0;
          }
        }
        this._framePos = frames[currentAnim.frame];
      }
    }
    draw(ctx) {
      ctx.globalAlpha = this.opacity;
      this.drawImage(ctx, {
        clip: false,
        width: this._width,
        height: this._height,
        framePosition: this._framePos
      });
    }
    drawShadow(ctx) {
      ctx.fillStyle = this.shadowColor.value;
      ctx.beginPath();
      ctx.rect(-this._width / 2, -this._height / 2, this._width, this._height);
      ctx.fill();
    }
  };

  // src/utils/Tileset.js
  var Tileset = class {
    constructor(params) {
      this._image = params.image;
      this._tileWidth = params.tileWidth;
      this._tileHeight = params.tileHeight;
      this._columns = params.columns;
      this._tileCount = params.tileCount;
      this._tileData = [];
    }
    get image() {
      return this._image;
    }
    get tileWidth() {
      return this._tileWidth;
    }
    get tileHeight() {
      return this._tileHeight;
    }
    get columns() {
      return this._columns;
    }
    get tileCount() {
      return this._tileCount;
    }
    createTile(scene, id) {
      let data = this._getData(id);
      let e = new Entity(scene);
      let sprite;
      if (data && data.animation) {
        sprite = new Sprite({
          image: {
            name: this._image,
            frameWidth: this._tileWidth,
            frameHeight: this._tileHeight
          }
        });
        sprite.addAnim("loop", data.animation.frames.map((e2) => this._getPos(e2)));
        sprite.play("loop", data.animation.frameRate, true);
      } else {
        sprite = new Picture({
          image: {
            name: this._image,
            frameWidth: this._tileWidth,
            frameHeight: this._tileHeight,
            framePosition: this._getPos(id)
          }
        });
      }
      e.addComponent(sprite, "TileSprite");
      let obj = {};
      if (data != null) {
        for (let prop of data.properties) {
          obj[prop.name] = prop.value;
        }
      }
      return {
        tile: e,
        data: obj
      };
    }
    addAnim(id, rate, frames) {
      let data = this._getData(id);
      if (!data) {
        data = this._createData(id);
      }
      data.animation = {
        frameRate: rate,
        frames
      };
    }
    addProp(id, name, value) {
      let data = this._getData(id);
      if (!data) {
        data = this._createData(id);
      }
      data.properties.push({ name, value });
    }
    _getPos(id) {
      return { x: id % this._columns, y: Math.floor(id / this._columns) };
    }
    _createData(id) {
      let data = {
        id,
        properties: []
      };
      this._tileData.push(data);
      return data;
    }
    _getData(id) {
      return this._tileData.find((e) => e.id == id);
    }
    static loadFromTiledJSON(obj, image) {
      let tileset = new Tileset({
        image,
        tileWidth: obj.tilewidth,
        tileHeight: obj.tileheight,
        columns: obj.columns,
        tileCount: obj.tilecount
      });
      if (obj.tiles) {
        for (let data of obj.tiles) {
          const id = data.id;
          if (data.properties) {
            for (let prop of data.properties) {
              tileset.addProp(id, prop.name, prop.value);
            }
          }
          if (data.animation) {
            let frames = [];
            for (let frame of data.animation) {
              frames.push(frame.tileid);
            }
            tileset.addAnim(id, data.animation[0].duration, frames);
          }
        }
      }
      return tileset;
    }
  };

  // src/utils/LevelMaker.js
  var LevelMaker = class {
    _tileWidth;
    _tileHeight;
    _onTile = null;
    _onObject = null;
    constructor(params) {
      this._tileWidth = params.tileWidth;
      this._tileHeight = params.tileHeight;
    }
    get tileWidth() {
      return this._tileWidth;
    }
    set tileWidth(val) {
      this._tileWidth = val;
    }
    get tileHeight() {
      return this._tileHeight;
    }
    set tileHeight(val) {
      this._tileHeight = val;
    }
    onTile(cb) {
      this._onTile = cb;
    }
    onObject(cb) {
      this._onObject = cb;
    }
    createLevel(scene, tilemap, tilesets) {
      const createTile = (id) => {
        let idx = -1;
        let counter = 0;
        for (let i = 0; i < tilesets.length; ++i) {
          if (id < counter + tilesets[i].tileCount) {
            idx = i;
            break;
          }
          counter += tilesets[i].tileCount;
        }
        if (idx == -1) {
          return null;
        }
        return tilesets[idx].createTile(scene, id - counter);
      };
      const processTiles = (layer, zIndex) => {
        for (let i = 0; i < layer.data.length; ++i) {
          const id = layer.data[i] - 1;
          const x = i % tilemap.width;
          const y = Math.floor(i / tilemap.width);
          if (id == -1) {
            continue;
          }
          ;
          const obj = createTile(id);
          if (obj === null) {
            return;
          }
          let e = obj.tile;
          e.position.set((x + 0.5) * this._tileWidth, (y + 0.5) * this._tileHeight);
          const tileSprite = e.getComponent("TileSprite");
          tileSprite.setSize(this._tileWidth, this._tileHeight);
          tileSprite.zIndex = zIndex;
          if (this._onTile) {
            this._onTile(e, obj.data, zIndex);
          }
        }
      };
      const processObjects = (layer, zIndex) => {
        const getPosition = (x, y, angle, cx, cy) => {
          const center = new Vector(cx, cy);
          center.rot(angle);
          return new Vector(x, y).sub(center);
        };
        for (let obj of layer.objects) {
          let data = {
            name: obj.name,
            type: obj.type,
            x: obj.x / tilemap.tilewidth * this._tileWidth,
            y: obj.y / tilemap.tileheight * this._tileHeight,
            angle: obj.rotation === void 0 ? 0 : obj.rotation / 180 * Math.PI,
            width: obj.width === void 0 ? 0 : obj.width / tilemap.tilewidth * this._tileWidth,
            height: obj.height === void 0 ? 0 : obj.height / tilemap.tileheight * this._tileHeight
          };
          let e;
          if (obj.gid !== void 0) {
            e = createTile(obj.gid - 1).tile;
            e.position = getPosition(data.x, data.y, data.angle, -data.width / 2, data.height / 2);
            const tileSprite = e.getComponent("TileSprite");
            tileSprite.setSize(data.width, data.height);
            tileSprite.angle = data.angle;
            tileSprite.zIndex = zIndex;
          } else {
            e = new Entity(scene);
            e.position = getPosition(data.x, data.y, data.angle, -data.width / 2, -data.height / 2);
          }
          if (this._onObject) {
            this._onObject(e, data, zIndex);
          }
          let props = new Map();
          if (obj.properties !== void 0) {
            for (let prop of obj.properties) {
              props.set(prop.name, prop.value);
            }
          }
        }
      };
      for (let i = 0; i < tilemap.layers.length; ++i) {
        const layer = tilemap.layers[i];
        const zIndex = i;
        switch (layer.type) {
          case "tilelayer":
            processTiles(layer, zIndex);
            break;
          case "objectgroup":
            processObjects(layer, zIndex);
            break;
        }
      }
    }
  };

  // src/drawable/_index.js
  var index_exports2 = {};
  __export(index_exports2, {
    Buffer: () => Buffer2,
    Circle: () => Circle,
    Drawable: () => Drawable,
    FixedDrawable: () => FixedDrawable,
    Heart: () => Heart,
    Line: () => Line,
    Path: () => Path,
    Picture: () => Picture,
    Polygon: () => Polygon2,
    Rect: () => Rect,
    RegularPolygon: () => RegularPolygon2,
    Ring: () => Ring,
    RoundedRect: () => RoundedRect,
    Sprite: () => Sprite,
    Star: () => Star,
    Text: () => Text,
    fillRing: () => fillRing,
    heart: () => heart,
    polygon: () => polygon,
    regularPolygon: () => regularPolygon,
    roundedRect: () => roundedRect,
    star: () => star,
    strokeRing: () => strokeRing
  });

  // src/drawable/Rect.js
  var Rect = class extends FixedDrawable {
    constructor(params) {
      super(params);
    }
    draw(ctx) {
      ctx.globalAlpha = this.opacity;
      ctx.lineWidth = this.strokeWidth;
      ctx.lineCap = this.strokeCap;
      ctx.fillStyle = this.fillColor.value;
      ctx.strokeStyle = this.strokeColor.value;
      ctx.beginPath();
      ctx.rect(-this._width / 2, -this._height / 2, this._width, this._height);
      ctx.fill();
      if (this._strokeWidth != 0) {
        ctx.stroke();
      }
      this.drawImage(ctx);
    }
    drawShadow(ctx) {
      ctx.lineWidth = this.strokeWidth;
      ctx.lineCap = this.strokeCap;
      ctx.fillStyle = this.shadowColor.value;
      ctx.strokeStyle = this.shadowColor.value;
      if (this.fillColor != "transparent") {
        ctx.globalAlpha = this._fillColor.alpha;
        ctx.fillRect(-this._width / 2, -this._height / 2, this._width, this._height);
      }
      if (this.strokeWidth != 0) {
        ctx.globalAlpha = this._strokeColor.alpha;
        ctx.strokeRect(-this._width / 2, -this._height / 2, this._width, this._height);
      }
    }
  };

  // src/drawable/Primitives.js
  var fillRing = function(ctx, x, y, r1, r2) {
    const strokeStyle = ctx.strokeStyle, lineWidth = ctx.lineWidth;
    ctx.beginPath();
    ctx.strokeStyle = ctx.fillStyle;
    ctx.lineWidth = r2 - r1;
    ctx.arc(x, y, r1 + (r2 - r1) / 2, 0, 2 * Math.PI);
    ctx.stroke();
    ctx.strokeStyle = strokeStyle;
    ctx.lineWidth = lineWidth;
  };
  var strokeRing = function(ctx, x, y, r1, r2) {
    ctx.beginPath();
    ctx.arc(x, y, r1, 0, 2 * Math.PI);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x, y, r2, 0, 2 * Math.PI);
    ctx.stroke();
  };
  var polygon = function(ctx, ...points) {
    let v = points[0];
    let len = v.length;
    ctx.moveTo(v[len - 2], v[len - 1]);
    for (let i = 0; i <= points.length; ++i) {
      v = points[i % points.length];
      len = v.length;
      if (v.length == 6) {
        ctx.bezierCurveTo(...v);
      } else if (v.length == 4) {
        ctx.quadraticCurveTo(...v);
      } else {
        ctx.lineTo(...v);
      }
    }
  };
  var roundedRect = function(ctx, x, y, w, h, r) {
    polygon(ctx, [x, y + r], [x, y, x + r, y], [w + x - r, y], [w + x, y, w + x, y + r], [w + x, h + y - r], [w + x, h + y, w + x - r, h + y], [x + r, h + y], [x, h + y, x, h + y - r]);
  };
  var regularPolygon = function(ctx, x, y, r, c) {
    const points = [];
    for (let i = 0; i < c; ++i) {
      const angle = 2 * Math.PI * (i / c - 0.25);
      points.push([x + Math.cos(angle) * r, y + Math.sin(angle) * r]);
    }
    polygon(ctx, ...points);
  };
  var star = function(ctx, x, y, r1, r2, c) {
    const count = c * 2;
    const points = [];
    for (let i = 0; i < count; ++i) {
      const angle = 2 * Math.PI * (i / count - 0.25);
      const d = i % 2 ? r1 : r2;
      points.push([x + Math.cos(angle) * d, y + Math.sin(angle) * d]);
    }
    polygon(ctx, ...points);
  };
  var heart = function(ctx, x, y, w, h) {
    ctx.moveTo(x, y + h / 4);
    ctx.quadraticCurveTo(x, y, x + w / 4, y);
    ctx.quadraticCurveTo(x + w / 2, y, x + w / 2, y + h / 4);
    ctx.quadraticCurveTo(x + w / 2, y, x + w * 3 / 4, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + h / 4);
    ctx.quadraticCurveTo(x + w, y + h / 2, x + w * 3 / 4, y + h * 3 / 4);
    ctx.lineTo(x + w / 2, y + h);
    ctx.lineTo(x + w / 4, y + h * 3 / 4);
    ctx.quadraticCurveTo(x, y + h / 2, x, y + h / 4);
  };

  // src/drawable/Polygon.js
  var Polygon2 = class extends FixedDrawable {
    _points;
    constructor(params) {
      super(params);
      this._points = paramParser.parseValue(params.points, []);
    }
    getBoundingBox() {
      const verts2 = this._points;
      let maxDist = 0;
      let idx = 0;
      for (let i = 0; i < verts2.length; ++i) {
        const v = verts2[i];
        const len = v.length;
        const dist = Math.hypot(v[len - 2], v[len - 1]);
        if (dist > maxDist) {
          maxDist = dist;
          idx = i;
        }
      }
      const d = maxDist * 2;
      return {
        width: d * Math.abs(this.scale.x),
        height: d * Math.abs(this.scale.y),
        x: this.position.x - this._center.x * Math.abs(this.scale.x),
        y: this.position.y - this._center.y * Math.abs(this.scale.y)
      };
    }
    draw(ctx) {
      ctx.globalAlpha = this.opacity;
      ctx.lineWidth = this.strokeWidth;
      ctx.lineCap = this.strokeCap;
      ctx.fillStyle = this.fillColor.value;
      ctx.strokeStyle = this.strokeColor.value;
      ctx.beginPath();
      polygon(ctx, ...this._points);
      ctx.closePath();
      ctx.fill();
      if (this._strokeWidth != 0) {
        ctx.stroke();
      }
      this.drawImage(ctx);
    }
    drawShadow(ctx) {
      ctx.lineWidth = this.strokeWidth;
      ctx.lineCap = this.strokeCap;
      ctx.fillStyle = this.shadowColor.value;
      ctx.strokeStyle = this.shadowColor.value;
      if (this.fillColor != "transparent") {
        ctx.globalAlpha = this._fillColor.alpha;
        ctx.beginPath();
        polygon(ctx, ...this._points);
        ctx.closePath();
        ctx.fill();
      }
      if (this.strokeWidth != 0) {
        ctx.globalAlpha = this._strokeColor.alpha;
        ctx.beginPath();
        polygon(ctx, ...this._points);
        ctx.closePath();
        ctx.stroke();
      }
    }
  };
  var RegularPolygon2 = class extends Polygon2 {
    _radius;
    _edges;
    constructor(params) {
      super(params);
      this._radius = params.radius;
      this._edges = params.edges;
      this._initPoints();
    }
    get radius() {
      return this._radius;
    }
    set radius(val) {
      this._radius = Math.max(val, 0);
      this._initPoints();
    }
    get edges() {
      return this._edges;
    }
    set edges(val) {
      this._edges = Math.max(val, 3);
      this._initPoints();
    }
    _initPoints() {
      const points = [];
      for (let i = 0; i < this.edges; ++i) {
        const angle = 2 * Math.PI * (i / this.edges - 0.25);
        points.push([Math.cos(angle) * this.radius, Math.sin(angle) * this.radius]);
      }
      this._points = points;
    }
    getBoundingBox() {
      return {
        width: this._radius * 2 * Math.abs(this.scale.x),
        height: this._radius * 2 * Math.abs(this.scale.y),
        x: this.position.x - this._center.x * Math.abs(this.scale.x),
        y: this.position.y - this._center.y * Math.abs(this.scale.y)
      };
    }
  };
  var Star = class extends Polygon2 {
    _innerRadius;
    _outerRadius;
    _peaks;
    constructor(params) {
      super(params);
      this._innerRadius = params.innerRadius;
      this._outerRadius = params.outerRadius;
      this._peaks = params.peaks;
      this._initPoints();
    }
    get innerRadius() {
      return this._innerRadius;
    }
    set innerRadius(val) {
      this._innerRadius = Math.max(val, 0);
      this._initPoints();
    }
    get outerRadius() {
      return this._innerRadius;
    }
    set outerRadius(val) {
      this._outerRadius = Math.max(val, 0);
      this._initPoints();
    }
    get peaks() {
      return this._peaks;
    }
    set peaks(val) {
      this._peaks = Math.max(val, 3);
      this._initPoints();
    }
    _initPoints() {
      const count = this._peaks * 2;
      const points = [];
      for (let i = 0; i < count; ++i) {
        const angle = 2 * Math.PI * (i / count - 0.25);
        const d = i % 2 ? this._innerRadius : this._outerRadius;
        points.push([Math.cos(angle) * d, Math.sin(angle) * d]);
      }
      this._points = points;
    }
    getBoundingBox() {
      return {
        width: this._outerRadius * 2 * Math.abs(this.scale.x),
        height: this._outerRadius * 2 * Math.abs(this.scale.y),
        x: this.position.x - this._center.x * Math.abs(this.scale.x),
        y: this.position.y - this._center.y * Math.abs(this.scale.y)
      };
    }
  };
  var RoundedRect = class extends Polygon2 {
    _borderRadius;
    constructor(params) {
      super(params);
      this._borderRadius = params.borderRadius;
      this._initPoints();
    }
    get width() {
      return this._width;
    }
    set width(val) {
      this._width = val;
      this._initPoints();
    }
    get height() {
      return this._height;
    }
    set height(val) {
      this._height = val;
      this._initPoints();
    }
    get borderRadius() {
      return this._borderRadius;
    }
    set borderRadius(val) {
      this._borderRadius = val;
      this._initPoints();
    }
    _initPoints() {
      const w = this._width;
      const h = this._height;
      const r = this._borderRadius;
      this._points = [
        [-w / 2, -(h / 2 - r)],
        [-w / 2, -h / 2, -(w / 2 - r), -h / 2],
        [w / 2 - r, -h / 2],
        [w / 2, -h / 2, w / 2, -(h / 2 - r)],
        [w / 2, h / 2 - r],
        [w / 2, h / 2, w / 2 - r, h / 2],
        [-(w / 2 - r), h / 2],
        [-w / 2, h / 2, -w / 2, h / 2 - r]
      ];
    }
  };

  // src/drawable/Line.js
  var Line = class extends FixedDrawable {
    _length;
    constructor(params) {
      super(params);
      this._length = params.length;
    }
    get length() {
      return this._length;
    }
    set length(val) {
      this._length = Math.max(val, 0);
    }
    getGoundingBox() {
      const center = Vector.fromAngle(this._angle).mult(this._length / 2);
      return {
        width: this._length * Math.abs(this.scale.x),
        height: this._length * Math.abs(this.scale.y),
        x: center.x,
        y: center.y
      };
    }
    draw(ctx) {
      ctx.globalAlpha = this.opacity;
      ctx.lineWidth = this.strokeWidth;
      ctx.lineCap = this.strokeCap;
      ctx.strokeStyle = this.strokeColor.value;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(this._length, 0);
      ctx.stroke();
    }
    drawShadow(ctx) {
      ctx.lineWidth = this.strokeWidth;
      ctx.lineCap = this.strokeCap;
      ctx.strokeStyle = this.shadowColor.value;
      ctx.globalAlpha = this._strokeColor.alpha;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(this._length, 0);
      ctx.stroke();
    }
  };

  // src/drawable/Circle.js
  var Circle = class extends FixedDrawable {
    _radius;
    constructor(params) {
      super(params);
      this._radius = params.radius;
      this._angleRange = paramParser.parseValue(params.angleRange, 2 * Math.PI);
      this._centered = paramParser.parseValue(params.centered, false);
    }
    get radius() {
      return this._radius;
    }
    set radius(val) {
      this._radius = val;
    }
    get angleRange() {
      return this._angleRange;
    }
    set angleRange(val) {
      this._angleRange = val;
    }
    getBoundingBox() {
      return {
        width: this._radius * 2 * Math.abs(this.scale.x),
        height: this._radius * 2 * Math.abs(this.scale.y),
        x: this.position.x - this._center.x * Math.abs(this.scale.x),
        y: this.position.y - this._center.y * Math.abs(this.scale.y)
      };
    }
    draw(ctx) {
      ctx.globalAlpha = this.opacity;
      ctx.lineWidth = this.strokeWidth;
      ctx.lineCap = this.strokeCap;
      ctx.fillStyle = this.fillColor.value;
      ctx.strokeStyle = this.strokeColor.value;
      ctx.beginPath();
      ctx.arc(0, 0, this._radius, -this.angleRange / 2, this.angleRange / 2);
      if (this._centered) {
        ctx.lineTo(0, 0);
      }
      ctx.closePath();
      ctx.fill();
      if (this.strokeWidth != 0) {
        ctx.stroke();
      }
      this.drawImage(ctx);
    }
    drawShadow(ctx) {
      ctx.lineWidth = this.strokeWidth;
      ctx.lineCap = this.strokeCap;
      ctx.fillStyle = this.shadowColor.value;
      ctx.strokeStyle = this.shadowColor.value;
      if (this.fillColor != "transparent") {
        ctx.globalAlpha = this._fillColor.alpha;
        ctx.beginPath();
        ctx.arc(0, 0, this._radius, -this.angleRange / 2, this.angleRange / 2);
        if (this._centered) {
          ctx.lineTo(0, 0);
        }
        ctx.closePath();
        ctx.fill();
      }
      if (this.strokeWidth != 0) {
        ctx.globalAlpha = this._strokeColor.alpha;
        ctx.beginPath();
        ctx.arc(0, 0, this._radius, -this.angleRange / 2, this.angleRange / 2);
        if (this._centered) {
          ctx.lineTo(0, 0);
        }
        ctx.closePath();
        ctx.stroke();
      }
    }
  };

  // src/drawable/Text.js
  var Text = class extends FixedDrawable {
    _text;
    _lines;
    _padding;
    _align;
    _fontFamily;
    _fontSize;
    _fontStyle;
    constructor(params) {
      super(params);
      this._text = paramParser.parseValue(params.text, "");
      this._lines = this._text.split(/\n/);
      this._padding = paramParser.parseValue(params.padding, 0);
      this._align = paramParser.parseValue(params.align, "center");
      this._fontSize = paramParser.parseValue(params.fontSize, 16);
      this._fontFamily = paramParser.parseValue(params.fontFamily, "Arial");
      this._fontStyle = paramParser.parseValue(params.fontStyle, "normal");
      this._computeDimensions();
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
      this._lines = this._text.split(/\n/);
      this._computeDimensions();
    }
    get fontSize() {
      return this._fontSize;
    }
    set fontSize(val) {
      this._fontSize = Math.max(val, 0);
      this._computeDimensions();
    }
    get fontFamily() {
      return this._fontFamily;
    }
    set fontFamily(val) {
      this._fontFamily = val;
      this._computeDimensions();
    }
    get padding() {
      return this._padding;
    }
    set padding(val) {
      this._padding = val;
      this._computeDimensions();
    }
    get align() {
      return this._align;
    }
    set align(s) {
      this._align = s;
      this._computeDimensions();
    }
    _computeDimensions() {
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
    draw(ctx) {
      ctx.globalAlpha = this.opacity;
      ctx.lineWidth = this.strokeWidth;
      ctx.lineCap = this.strokeCap;
      ctx.fillStyle = this.fillColor.value;
      ctx.strokeStyle = this.strokeColor.value;
      ctx.font = `${this._fontStyle} ${this._fontSize}px '${this._fontFamily}'`;
      ctx.textAlign = this._align;
      ctx.textBaseline = "middle";
      ctx.beginPath();
      for (let i = 0; i < this.linesCount; ++i) {
        ctx.fillText(this._lines[i], this._padding, this.lineHeight * i - (this.linesCount - 1) / 2 * this.lineHeight);
        if (this._strokeWidth) {
          ctx.strokeText(this._lines[i], this._padding, this.lineHeight * i - (this.linesCount - 1) / 2 * this.lineHeight);
        }
      }
    }
    drawShadow(ctx) {
      ctx.lineWidth = this.strokeWidth;
      ctx.lineCap = this.strokeCap;
      ctx.fillStyle = this.shadowColor.value;
      ctx.strokeStyle = this.shadowColor.value;
      let offsetX = this._align == "left" ? -this._width / 2 : this._align == "right" ? this._width / 2 : 0;
      ctx.font = `${this._fontStyle} ${this._fontSize}px '${this._fontFamily}'`;
      ctx.textAlign = this._align;
      ctx.textBaseline = "middle";
      ctx.beginPath();
      for (let i = 0; i < this.linesCount; ++i) {
        if (this.fillColor != "transparent") {
          ctx.globalAlpha = this._fillColor.alpha;
          ctx.fillText(this._lines[i], offsetX + this._padding, this.lineHeight * i - (this.linesCount - 1) / 2 * this.lineHeight);
        }
        if (this._strokeWidth) {
          ctx.globalAlpha = this._strokeColor.alpha;
          ctx.strokeText(this._lines[i], offsetX + this._padding, this.lineHeight * i - (this.linesCount - 1) / 2 * this.lineHeight);
        }
      }
    }
  };

  // src/drawable/Path.js
  var Path = class extends Drawable {
    _points;
    constructor(params) {
      super(params);
      this._points = params.points;
    }
    getBoundingBox() {
      const verts2 = this._points;
      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      for (let i = 0; i < verts2.length; ++i) {
        const v = verts2[i];
        const len = v.length;
        const x = v[len - 2], y = v[len - 1];
        if (x < minX) {
          minX = x;
        } else if (x > maxX) {
          maxX = x;
        }
        if (y < minY) {
          minY = y;
        } else if (y > maxY) {
          maxY = y;
        }
      }
      return {
        width: Math.abs(maxX - minX),
        height: Math.abs(maxY - minY),
        x: (maxX + minX) / 2,
        y: (maxY + minY) / 2
      };
    }
    draw(ctx) {
      ctx.globalAlpha = this.opacity;
      ctx.lineWidth = this.strokeWidth;
      ctx.lineCap = this.strokeCap;
      ctx.fillStyle = this.fillColor.value;
      ctx.strokeStyle = this.strokeColor.value;
      ctx.beginPath();
      polygon(ctx, ...this._points);
      ctx.closePath();
      ctx.fill();
      if (this._strokeWidth != 0) {
        ctx.stroke();
      }
    }
    drawShadow(ctx) {
      ctx.lineWidth = this.strokeWidth;
      ctx.lineCap = this.strokeCap;
      this._shadowColor.fill(ctx);
      this._shadowColor.stroke(ctx);
      if (this.fillColor != "transparent") {
        ctx.globalAlpha = this._fillColor.alpha;
        ctx.beginPath();
        polygon(ctx, ...this._points);
        ctx.closePath();
        ctx.fill();
      }
      if (this.strokeWidth != 0) {
        ctx.globalAlpha = this._strokeColor.alpha;
        ctx.beginPath();
        polygon(ctx, ...this._points);
        ctx.closePath();
        ctx.stroke();
      }
    }
  };

  // src/drawable/Buffer.js
  var Buffer2 = class extends Drawable {
    _buffer = document.createElement("canvas").getContext("2d");
    constructor(params) {
      super(params);
      this._bounds = params.bounds;
      this._initBuffer();
    }
    _initBuffer() {
      this._buffer.canvas.width = this._bounds[1][0] - this._bounds[0][0];
      this._buffer.canvas.height = this._bounds[1][1] - this._bounds[0][1];
    }
    add(elem) {
      const ctx = this._buffer;
      ctx.save();
      ctx.translate(-this._bounds[0][0], -this._bounds[0][1]);
      elem.drawInternal(ctx);
      ctx.restore();
    }
    clear() {
      const ctx = this._buffer;
      ctx.beginPath();
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    }
    getBoundingBox() {
      const w = this._bounds[1][0] - this._bounds[0][0], h = this._bounds[1][1] - this._bounds[0][1];
      return {
        width: w,
        height: h,
        x: this._bounds[0][0] + w / 2,
        y: this._bounds[0][1] + h / 2
      };
    }
    draw(ctx) {
      ctx.globalAlpha = this.opacity;
      ctx.beginPath();
      ctx.drawImage(this._buffer.canvas, this._bounds[0][0], this._bounds[0][1]);
    }
  };

  // src/drawable/Ring.js
  var Ring = class extends FixedDrawable {
    _innerRadius;
    _outerRadius;
    constructor(params) {
      super(params);
      this._innerRadius = params.innerRadius;
      this._outerRadius = params.outerRadius;
    }
    get innerRadius() {
      return this._innerRadius;
    }
    set innerRadius(val) {
      this._innerRadius = Math.max(val, 0);
    }
    get outerRadius() {
      return this._innerRadius;
    }
    set outerRadius(val) {
      this._outerRadius = Math.max(val, this._innerRadius);
    }
    getBoundingBox() {
      return {
        width: this._outerRadius * 2 * Math.abs(this.scale.x),
        height: this._outerRadius * 2 * Math.abs(this.scale.y),
        x: this.position.x - this._center.x * Math.abs(this.scale.x),
        y: this.position.y - this._center.y * Math.abs(this.scale.y)
      };
    }
    draw(ctx) {
      ctx.globalAlpha = this.opacity;
      ctx.lineWidth = this.strokeWidth;
      ctx.lineCap = this.strokeCap;
      ctx.fillStyle = this.fillColor.value;
      ctx.strokeStyle = this.strokeColor.value;
      fillRing(ctx, 0, 0, this._innerRadius, this._outerRadius);
      if (this.strokeWidth != 0) {
        strokeRing(ctx, 0, 0, this._innerRadius, this._outerRadius);
      }
    }
    drawShadow(ctx) {
      ctx.lineWidth = this.strokeWidth;
      ctx.lineCap = this.strokeCap;
      ctx.fillStyle = this.shadowColor.value;
      ctx.strokeStyle = this.shadowColor.value;
      if (this.fillColor != "transparent") {
        ctx.globalAlpha = this._fillColor.alpha;
        fillRing(ctx, 0, 0, this._innerRadius, this._outerRadius);
      }
      if (this.strokeWidth != 0) {
        ctx.globalAlpha = this._strokeColor.alpha;
        strokeRing(ctx, 0, 0, this._innerRadius, this._outerRadius);
      }
    }
  };

  // src/drawable/Heart.js
  var Heart = class extends FixedDrawable {
    constructor(params) {
      super(params);
    }
    draw(ctx) {
      ctx.globalAlpha = this.opacity;
      ctx.lineWidth = this.strokeWidth;
      ctx.lineCap = this.strokeCap;
      ctx.fillStyle = this.fillColor.value;
      ctx.strokeStyle = this.strokeColor.value;
      ctx.beginPath();
      heart(ctx, -this._width / 2, -this._height / 2, this._width, this._height);
      ctx.closePath();
      ctx.fill();
      if (this._strokeWidth != 0) {
        ctx.stroke();
      }
      this.drawImage(ctx);
    }
    drawShadow(ctx) {
      ctx.lineWidth = this.strokeWidth;
      ctx.lineCap = this.strokeCap;
      ctx.fillStyle = this.shadowColor.value;
      ctx.strokeStyle = this.shadowColor.value;
      if (this.fillColor != "transparent") {
        ctx.globalAlpha = this._fillColor.alpha;
        ctx.beginPath();
        heart(ctx, -this._width / 2, -this._height / 2, this._width, this._height);
        ctx.closePath();
        ctx.fill();
      }
      if (this.strokeWidth != 0) {
        ctx.globalAlpha = this._strokeColor.alpha;
        ctx.beginPath();
        heart(ctx, -this._width / 2, -this._height / 2, this._width, this._height);
        ctx.closePath();
        ctx.stroke();
      }
    }
  };

  // src/physics/_index.js
  var index_exports3 = {};
  __export(index_exports3, {
    Ball: () => Ball,
    Box: () => Box,
    Polygon: () => Polygon,
    Ray: () => Ray,
    RegularPolygon: () => RegularPolygon
  });

  // src/Lancelot.js
  var start = (config) => {
    addEventListener("DOMContentLoaded", () => new Game(config));
  };
  var __name = "Lancelot";
  var __export2 = {
    start,
    Scene,
    Component,
    utils: index_exports,
    drawable: index_exports2,
    physics: index_exports3
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
})();
