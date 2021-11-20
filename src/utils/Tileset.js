import { Component } from "../core/Component.js";
import { Picture } from "../drawable/Picture.js";
import { Sprite } from "../drawable/Sprite.js";

export class Tileset {
    constructor(params) {
        this._image = params.image;
        this._tileWidth = params.tileWidth;
        this._tileHeight = params.tileHeight;
        this._columns = params.columns;
        this._tileData = [];
    }

    get image() {
        return this._image;
    }
    get tileWidth() {
        return this._tileWidth;
    }
    get tileHeight() {
        return this._tileHeight;
    }
    get columns() {
        return this._columns;
    }

    createTile(scene, id) {
        let data = this._getData(id);

        let e = scene.createEntity();
        
        let sprite;
        if(data && data.animation) {
            sprite = new Sprite({
                image: {
                    name: this._image,
                    frameWidth: this._tileWidth,
                    frameHeight: this._tileHeight
                }
            });
            sprite.addAnim("loop", data.animation.frames.map((e) => this._getPos(e)));
            sprite.play("loop", data.animation.frameRate, true);
        } else {
            sprite = new Picture({
                image: {
                    name: this._image,
                    frameWidth: this._tileWidth,
                    frameHeight: this._tileHeight,
                    framePosition: this._getPos(id)
                }
            });
        }
        e.addComponent(sprite, "TileSprite");
        e.addComponent(new TileData({
            properties: data == null ? [] : data.properties
        }));

        return e;
    }

    addAnim(id, rate, frames) {
        let data = this._getData(id);
        if(!data) {
            data = this._createData(id);
        }
        data.animation = {
            frameRate: rate,
            frames: frames
        };
    }

    addProperty(id, name, value) {
        let data = this._getData(id);
        if(!data) {
            data = this._createData(id);
        }
        data.properties.push({ name: name, value: value });
    }

    _getPos(id) {
        return { x: id % this._columns, y: Math.floor(id / this._columns) };
    }

    _createData(id) {
        let data = {
            id: id,
            properties: []
        };
        this._tileData.push(data);
        return data;
    }

    _getData(id) {
        return this._tileData.find((e) => e.id == id);
    }
}

class TileData extends Component {

    _properties = new Map();

    constructor(params) {
        super();
        
        for(let p of params.properties) {
            this._properties.set(p.name, p.value);
        }
    }

    get properties() {
        return this._properties;
    }
}