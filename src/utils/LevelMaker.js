
export class LevelMaker {

    _tileWidth;
    _tileHeight;
    _onTile = null;
    _onObject = null;

    constructor(params) {
        this._tileWidth = params.tileWidth;
        this._tileHeight = params.tileHeight;
    }

    get tileWidth() {
        return this._tileWidth;
    }

    set tileWidth(val) {
        this._tileWidth = val;
    }

    get tileHeight() {
        return this._tileHeight;
    }

    set tileHeight(val) {
        this._tileHeight = val;
    }

    onTile(cb) {
        this._onTile = cb;
    }

    onObject(cb) {
        this._onObject = cb;
    }

    createLevel(scene, tilemap, tilesets) {

        const createTile = (id) => {
            let idx = -1;
            let counter = 0;
            for (let i = 0; i < tilesets.length; ++i) {
                if (id < counter + tilesets[i].tileCount) {
                    idx = i;
                    break;
                }
                counter += tilesets[i].tileCount;
            }
            if (idx == -1) {
                return null;
            }
            return tilesets[idx].createTile(scene, id - counter);
        }

        const processTiles = (layer, zIndex) => {
            for(let i = 0; i < layer.data.length; ++i) {
                const id = layer.data[i] - 1;
                const x = i % tilemap.width;
                const y = Math.floor(i / tilemap.width);
                if(id == -1) {
                    continue;
                };
                let e = createTile(id);
                if(e === null) {
                    return;
                }
                e.position.set((x + 0.5) * this._tileWidth, (y + 0.5) * this._tileHeight);
                const tileSprite = e.getComponent("TileSprite");
                tileSprite.setSize(this._tileWidth, this._tileHeight);
                tileSprite.zIndex = zIndex;
                if(this._onTile) {
                    this._onTile(e);
                }
            }
        }
    
        const processObjects = (layer, zIndex) => {
            for(let obj of layer.objects) {
                let data = {
                    name: obj.name,
                    type: obj.type,
                    x: obj.x / tilemap.tilewidth * this._tileWidth,
                    y: obj.y / tilemap.tileheight * this._tileHeight,
                    width: obj.width === undefined ? 0 : obj.width / tilemap.tilewidth * this._tileWidth,
                    height: obj.height === undefined ? 0 : obj.height / tilemap.tileheight * this._tileHeight,
                };
                let e;
                if(obj.gid !== undefined) {
                    e = createTile(obj.gid - 1);
                    e.position.set(data.x + data.width / 2, data.y - data.height / 2);
                    const tileSprite = e.getComponent("TileSprite");
                    tileSprite.setSize(data.width, data.height);
                    tileSprite.zIndex = zIndex;
                } else {
                    e = scene.createEntity();
                    e.position.set(data.x, data.y);
                }
                if(this._onObject) {
                    this._onObject(e, data);
                }
            }
        }

        for(let i = 0; i < tilemap.layers.length; ++i) {
            const layer = tilemap.layers[i];
            const zIndex = i;
            switch(layer.type) {
                case "tilelayer":
                processTiles(layer, zIndex);
                    break;
                case "objectgroup":
                    processObjects(layer, zIndex);
                    break;
            }
        }

    }

}