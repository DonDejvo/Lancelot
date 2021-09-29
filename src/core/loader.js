export class Loader {
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
            type: type
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
    _OnProgressHandler(value, obj) {}
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
        if(this._size === 0) {
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
        fetch(p)
            .then(response => response.json())
            .then(json => cb(json));
    }
    static LoadFont(n, p, cb) {
        const font = new FontFace(n, `url(${p})`);
        font
            .load()
            .then((loadedFont) => {
            document.fonts.add(loadedFont);
            cb(n);
        });
    }
}