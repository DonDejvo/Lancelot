import { math } from "./utils/math.js";

export class SpatialHashGrid {
    constructor(bounds, dimensions) {
        const [x, y] = dimensions;
        this._cells = [...Array(y)].map(_ => [...Array(x)].map(_ => (null)));
        this._dimensions = dimensions;
        this._bounds = bounds;
    }

    NewClient(position, dimensions) {
        const client = {
            position: position,
            dimensions: dimensions,
            indices: null
        };
        this._InsertClient(client);
        return client;
    }

    _InsertClient(client) {
        const [w, h] = client.dimensions;
        const [x, y] = client.position;

        const i1 = this._GetCellIndex([x - w / 2, y - h / 2]);
        const i2 = this._GetCellIndex([x + w / 2, y + h / 2]);

        client.indices = [i1, i2];

        for (let y = i1[1]; y <= i2[1]; ++y) {
            for (let x = i1[0]; x <= i2[0]; ++x) {

                if (!this._cells[y][x]) {
                    this._cells[y][x] = new Set();
                }

                this._cells[y][x].add(client);
            }
        }
    }

    _GetCellIndex(position) {
        const x = math.sat((position[0] - this._bounds[0][0]) / (this._bounds[1][0] - this._bounds[0][0]));
        const y = math.sat((position[1] - this._bounds[0][1]) / (this._bounds[1][1] - this._bounds[0][1]));
        const xIndex = Math.floor(x * (this._dimensions[0] - 1));
        const yIndex = Math.floor(y * (this._dimensions[1] - 1));

        return [xIndex, yIndex];
    }

    FindNear(position, bounds) {
        const [w, h] = bounds;
        const [x, y] = position;

        const i1 = this._GetCellIndex([x - w / 2, y - h / 2]);
        const i2 = this._GetCellIndex([x + w / 2, y + h / 2]);

        const clients = new Set();

        for (let y = i1[1]; y <= i2[1]; ++y) {
            for (let x = i1[0]; x <= i2[0]; ++x) {

                if (this._cells[y][x]) {
                    for (let v of this._cells[y][x]) {
                        clients.add(v);
                    }
                }
            }
        }
        return Array.from(clients);
    }

    UpdateClient(client) {
        this.RemoveClient(client);
        this._InsertClient(client);
    }

    RemoveClient(client) {
        const [i1, i2] = client.indices;

        for (let y = i1[1]; y <= i2[1]; ++y) {
            for (let x = i1[0]; x <= i2[0]; ++x) {
                this._cells[y][x].delete(client);
            }
        }
    }

    Draw(ctx) {
        const bounds = this._bounds;
        ctx.save();
        ctx.strokeStyle = "white";
        ctx.beginPath();
        const cellWidth = (bounds[1][0] - bounds[0][0]) / this._dimensions[0];
        for(let x = 0; x <= this._dimensions[0]; ++x) {
            ctx.moveTo(bounds[0][0] + x * cellWidth, bounds[0][1]);
            ctx.lineTo(bounds[0][0] + x * cellWidth, bounds[1][1]);
        }
        const cellHeight = (bounds[1][1] - bounds[0][1]) / this._dimensions[1];
        for(let y = 0; y <= this._dimensions[1]; ++y) {
            ctx.moveTo(bounds[0][0], bounds[0][1] + y * cellHeight);
            ctx.lineTo(bounds[1][0], bounds[0][1] + y * cellHeight);
        }
        ctx.stroke();
        ctx.restore();
    }

}