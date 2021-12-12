export class Renderer {

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
        this._scale = 1.0;
        this._buffers = [];

        for(let i = 0; i < 5; ++i) {
            const b = document.createElement("canvas").getContext("2d");
            b.canvas.width = this._width * this._quality;
            b.canvas.height = this._height * this._quality;
            b.imageSmoothingEnabled = false;
            this._buffers[i] = b;
        }

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

        // this._draw(ctx, scenes, 0, 0);

        const w = this._width * this._quality;
        const h = this._height * this._quality;

        for(let i = scenes.length - 1; i >= 0; --i) {
            const scene = scenes[i];
            if(scene.hidden) {
                continue;
            }
            if(!scene.paused) {
                scene.render(w, h, this._quality);
            }
            scene.draw(ctx, w, h);
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

    /*
    _draw(ctx, scenes, sceneIndex, bufferIndex) {

        const scene = scenes[sceneIndex];
        if(!scene) {
            return;
        }
        if(scene.hidden) {
            this._draw(ctx, scenes, sceneIndex + 1, bufferIndex);
            return;
        }

        const w = this._width * this._quality;
        const h = this._height * this._quality;
        
        scene.drawLights(ctx, w, h, this._quality);

        if(!this._buffers[bufferIndex]) {
            const b = document.createElement("canvas").getContext("2d");
            b.canvas.width = w;
            b.canvas.height = h;
            this._buffers[bufferIndex] = b;
        }

        const b = this._buffers[bufferIndex];
        if(sceneIndex < scenes.length - 1) {
            this._draw(b, scenes, sceneIndex + 1, bufferIndex + 1);
            b.globalCompositeOperation = "source-over";
        }
        scene.drawObjects(b, w, h, this._quality);

        ctx.drawImage(b.canvas, 0, 0);

    }
    */

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
        if(width / height > this._aspect) {
            this._scale = height / this._height;
        } else {
            this._scale = width / this._width;
        }
        this._container.style.transform = "translate(-50%, calc(-50% + " + (this._height / 2 * this._scale) + "px)) scale(" + this._scale + ")";
        this._context.imageSmoothingEnabled = false;
    }
}