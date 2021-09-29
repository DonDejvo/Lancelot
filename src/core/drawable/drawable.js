export class Drawable extends Component {
    constructor(params) {
        super();
        this._type = "drawable";
        this._params = params;
        this._width = (this._params.width || 0);
        this._height = (this._params.height || 0);
        this._fixed = this._params.fixed === undefined ? true : this._params.fixed;
        this._zIndex = (this._params.zIndex || 0);
        this._flip = {
            x: (this._params.flipX || false),
            y: (this._params.flipY || false)
        };
        this._rotationCount = (this._params.rotationCount || 0);
        this._opacity = this._params.opacity !== undefined ? this._params.opacity : 1;
        this._angle = (this._params.angle || this._rotationCount * Math.PI / 2 || 0);

        this._offset = new Vector();
        this.boundingBox = { width: 0, height: 0, x: 0, y: 0 };
    }
    get zIndex() {
        return this._zIndex;
    }
    set zIndex(val) {
        this._zIndex = val;
        if(this.scene) {
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
    InitComponent() {
        this._UpdateBoundingBox();
    }
    _UpdateBoundingBox() {
        const vertices = new Array(4);
        vertices[0] = new Vector(-this._width / 2, -this._height / 2).Rotate(this._angle);
        vertices[1] = new Vector(this._width / 2, -this._height / 2).Rotate(this._angle);
        vertices[2] = new Vector(this._width / 2, this._height / 2).Rotate(this._angle);
        vertices[3] = new Vector(-this._width / 2, this._height / 2).Rotate(this._angle);
        let width = 0, height = 0;
        for(let i = 0; i < 2; ++i) {
            const w = Math.abs(vertices[i].x) + Math.abs(vertices[i + 2].x);
            const h = Math.abs(vertices[i].y) + Math.abs(vertices[i + 2].y);
            if(w > width) {
                width = w;
            }
            if(h > height) {
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
    Draw(_) { }
}