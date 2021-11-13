export class PathGraph {
    constructor() {
        this.vertices = {};
    }

    AddVertex(id, x, y, nb) {
        this.vertices[id] = {
            id: id,
            x: x,
            y: y,
            neighbors: nb,
            state: 0,
            parent: null,
            weight: Infinity
        };
    }

    _Dist(v1, v2) {
        return Math.hypot(v1.x - v2.x, v1.y - v2.y);
    }

    ShortestPath(start, end) {

        const open = (vert, weight = 0, parent = null) => {
            vert.state = 1;
            vert.weight = weight;
            vert.parent = parent;

            opened.push(vert);
            for (let i = opened.length - 1; i > 0; --i) {
                if (vert.weight < opened[i - 1].weight) {
                    break;
                }
                [opened[i], opened[i - 1]] = [opened[i - 1], opened[i]];
            }
        }

        let startVert = this.vertices[start];
        let opened = [];

        open(startVert);

        while(opened.length) {
            const curVert = opened.pop();

            for(let id of curVert.neighbors) {
                const nb = this.vertices[id];
                if(nb.state == 2) {
                    continue;
                }
                const dist = this._Dist(curVert, nb);
                const w = curVert.weight + dist;
                if(nb.weight > w) {
                    open(nb, w, curVert);
                    if(nb.id == end) {
                        return nb;
                    }
                }
            }
            curVert.state = 2;
        }
        return null;
    }
}