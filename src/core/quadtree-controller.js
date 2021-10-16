import { Component } from "./component.js";

export class QuadtreeController extends Component {
    constructor(params) {
        super();
        this._params = params;
        this._width = this._params.width;
        this._height = this._params.height;
        this._quadtree = this._params.quadtree;

    }
    InitComponent() {
        const pos = [
            this._parent.body.position.x,
            this._parent.body.position.y
        ];
        this._client = this._quadtree.NewClient(pos, [this._width, this._height]);
        this._client.entity = this._parent;
    }
    FindNearby(rangeX, rangeY) {
        const results = this._quadtree.FindNear(
            [this._parent.position.x, this._parent.position.y], [rangeX, rangeY]
        );
        return results.filter(c => c.entity != this._parent).map(c => c.entity);
    }
    UpdateClient() {
        const pos = [
            this._parent.body.position.x,
            this._parent.body.position.y
        ];
        this._client.x = pos[0];
        this._client.y = pos[1];
        this._quadtree.UpdateClient(this._client);
    }
}