import { Component } from "./component.js";

export class SpatialGridController extends Component {
    constructor(params) {
        super();
        this._params = params;
        this._width = this._params.width;
        this._height = this._params.height;
        this._grid = this._params.grid;

    }
    InitComponent() {
        const pos = [
            this._parent.body._pos.x,
            this._parent.body._pos.y
        ];
        this._client = this._grid.NewClient(pos, [this._width, this._height]);
        this._client.entity = this._parent;
    }
    Update(_) {
        const pos = [
            this._parent.body._pos.x,
            this._parent.body._pos.y
        ];
        if (pos[0] == this._client.position[0] && pos[1] == this._client.position[1]) {
            return;
        }
        this._client.position = pos;
        this._grid.UpdateClient(this._client);
    }
    FindNearby(rangeX, rangeY) {
        const results = this._grid.FindNear(
            [this._parent._pos.x, this._parent._pos.y], [rangeX, rangeY]
        );
        return results.filter(c => c.entity != this._parent).map(c => c.entity);
    }
}