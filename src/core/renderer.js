import { StyleParser } from "./utils/style-parser.js";
import { Vector } from "./utils/vector.js";

export class Renderer {
    constructor(params) {
        this._width = params.width;
        this._height = params.height;
        this._aspect = this._width / this._height;
        this._scale = 1.0;
        this._parentElement = params.parentElement;

        this._buffers = [];
        for(let i = 0; i < 5; ++i) {
            const b = document.createElement("canvas").getContext("2d");
            b.canvas.width = this._width;
            b.canvas.height = this._height;
            b.imageSmoothingEnabled = false;
            this._buffers[i] = b;
        }

        this._InitContainer();
        this._InitCanvas();

        this._OnResize();
        window.addEventListener("resize", () => this._OnResize());

        this.draw = (scenes, ctx, idx, idx2) => {

            const scene = scenes[idx];
            if(!scene) {
                return;
            }
            if(scene.paused) {
                this.draw(scenes, ctx, idx + 1, idx2);
                return;
            }

            const w = this._width;
            const h = this._height;
            scene.DrawLights(ctx, w, h);

            if(!this._buffers[idx2]) {
                const b = document.createElement("canvas").getContext("2d");
                b.canvas.width = this._width;
                b.canvas.height = this._height;
                this._buffers[idx2] = b;
            }
            const b = this._buffers[idx2];
            if(idx < scenes.length - 1) {
                this.draw(scenes, b, idx + 1, idx2 + 1);
                b.globalCompositeOperation = "source-over";
            }
            scene.DrawObjects(b, w, h);

            ctx.drawImage(b.canvas, 0, 0);
        }
    }
    get dimension() {
        return this._canvas.getBoundingClientRect();
    }
    _InitContainer() {

        const con = this._container = document.createElement("div");

        con.style.width = this._width + "px";
        con.style.height = this._height + "px";
        con.style.position = "relative";
        con.style.left = "50%";
        con.style.top = "0%";
        con.style.transformOrigin = "center";

        this._parentElement.appendChild(con);
        
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
        cnv.style.background = "black";

        this._container.appendChild(cnv);
    } 
    _OnResize() {
        const [width, height] = [this._parentElement.clientWidth, this._parentElement.clientHeight];
        if(width / height > this._aspect) {
            this._scale = height / this._height;
        } else {
            this._scale = width / this._width;
        }
        this._container.style.transform = "translate(-50%, calc(-50% + " + (this._height / 2 * this._scale) + "px)) scale(" + this._scale + ")";
        this._context.imageSmoothingEnabled = false;
    }
    Render(scenes) {

        const ctx = this._context;

        ctx.beginPath();
        ctx.clearRect(0, 0, this._width, this._height);

        this.draw(scenes, ctx, 0, 0);


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
}