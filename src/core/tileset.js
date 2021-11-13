import { Component } from "./component.js";
import { Image } from "./drawable/image.js";
import { Sprite } from "./drawable/sprite.js";

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

    _CreateData(id) {
        let data = {
            id: id,
            properties: []
        };
        this._tileData.push(data);
        return data;
    }

    _GetData(id) {
        return this._tileData.find((e) => e.id == id);
    }

    AddAnim(id, rate, frames) {
        let data = this._GetData(id);
        if(!data) {
            data = this._CreateData(id);
        }
        data.animation = {
            frameRate: rate,
            frames: frames
        };
    }

    AddProperty(id, name, value) {
        let data = this._GetData(id);
        if(!data) {
            data = this._CreateData(id);
        }
        data.properties.push({ name: name, value: value });
    }

    _GetPos(id) {
        return { x: id % this._columns, y: Math.floor(id / this._columns) };
    }

    CreateTile(scene, id) {
        let data = this._GetData(id);

        let e = scene.CreateEntity();
        
        let sprite;
        if(data && data.animation) {
            sprite = new Sprite({
                image: {
                    src: this._image,
                    frameWidth: this._tileWidth,
                    frameHeight: this._tileHeight
                }
            });
            sprite.AddAnim("loop", data.animation.frames.map((e) => this._GetPos(e)));
            sprite.PlayAnim("loop", data.animation.frameRate, true);
        } else {
            sprite = new Image({
                image: {
                    src: this._image,
                    frameWidth: this._tileWidth,
                    frameHeight: this._tileHeight,
                    framePosition: this._GetPos(id)
                }
            });
        }
        e.AddComponent(sprite, "TileSprite");
        e.AddComponent(new TileData({
            properties: data == null ? [] : data.properties
        }));

        return e;
    }
}

class TileData extends Component {
    constructor(params) {
        super();
        
        this.properties = new Map();
        
        for(let p of params.properties) {
            this.properties.set(p.name, p.value);
        }
    }
}