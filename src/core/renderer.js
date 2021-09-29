export class Renderer {
    constructor(params) {
        this._width = params.width;
        this._height = params.height;
        this._aspect = this._width / this._height;
        this._scale = 1.0;
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
        if(width / height > this._aspect) {
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

        if(!scene) return;

        const cam = scene.camera;

        ctx.save();
        ctx.translate(-cam.position.x * cam.scale + this._width / 2, -cam.position.y * cam.scale + this._height / 2);
        ctx.scale(cam.scale, cam.scale);

        for(let elem of scene._drawable) {
            const pos = elem.position.Clone();
            pos.Sub(cam.position);
            pos.Mult(cam.scale);
            const [width, height] = [elem.boundingBox.width, elem.boundingBox.height].map((_) => _ * cam.scale);
            if(
                pos.x + width / 2 < -this._width / 2 ||
                pos.x - width / 2 > this._width / 2 ||
                pos.y + height / 2 < -this._height / 2 ||
                pos.y - height / 2 > this._height / 2
            ) {
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
}