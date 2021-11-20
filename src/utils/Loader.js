/**
 * @callback OnProgress
 * @param {number} progress
 * @param {string} path
 */
/**
 * @typedef {Object} ToLoad
 * @property {string} name
 * @property {string} path
 * @property {string} type
 */
/**
 * @callback OnLoad
 * @param {Map<string, any>} loaded
 */

export class Loader {

    /** @type {ToLoad[]} */
    _toLoad = [];
    _size = 0;
    _counter = 0;
    _path = "";
    /** @type {OnProgress} */
    _onProgressHandler = null;

    /**
     * 
     * @param {string} n 
     * @param {string} p 
     * @param {string} type 
     */
    _add(n, p, type) {
        let path;
        if(p.startsWith("/")) {
            path = this._path + p.slice(1);
        } else {
            path = this._path + p;
        }
        this._toLoad.push({
            name: n,
            path: path,
            type: type
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
    /**
     * 
     * @param {OnProgress} f 
     */
     onProgress(f) {
        this._onProgressHandler = f;
    }
    /**
     * 
     * @param {string} p 
     */
    setPath(p) {
        this._path = p;
        if(!this._path.endsWith("/")) {
            this._path += "/";
        }
    }
    /**
     * 
     * @param {OnLoad} cb 
     * @returns 
     */
    load(cb) {
        const loaded = new Map();
        if(this._size === 0) {
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
    /**
     * 
     * @param {Map<string, any>} loaded 
     * @param {ToLoad} obj 
     * @param {any} e 
     * @param {OnLoad} cb 
     */
    _handleCallback(loaded, obj, e, cb) {
        loaded.set(obj.name, e);
        ++this._counter;
        if(this._onProgressHandler) {
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
        fetch(p)
            .then(response => response.json())
            .then(json => cb(json));
    }
    static loadFont(n, p, cb) {
        const font = new FontFace(n, `url(${p})`);
        font
            .load()
            .then((loadedFont) => {
            document.fonts.add(loadedFont);
            cb(n);
        });
    }
}