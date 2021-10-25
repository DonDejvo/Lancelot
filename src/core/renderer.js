import { StyleParser } from "./utils/style-parser.js";
import { Vector } from "./utils/vector.js";

export class Renderer {
    constructor(params) {
        this._width = params.width;
        this._height = params.height;
        this._aspect = this._width / this._height;
        this._scale = 1.0;

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
        if(width / height > this._aspect) {
            this._scale = height / this._height;
        } else {
            this._scale = width / this._width;
        }
        this._container.style.transform = "translate(-50%, calc(-50% + " + (this._height / 2 * this._scale) + "px)) scale(" + this._scale + ")";
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
}