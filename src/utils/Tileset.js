import { Component } from "../core/Component.js";
import { Entity } from "../core/Entity.js";
import { Picture } from "../drawable/Picture.js";
import { Sprite } from "../drawable/Sprite.js";

export class Tileset {
    constructor(params) {
        this._image = params.image;
        this._tileWidth = params.tileWidth;
        this._tileHeight = params.tileHeight;
        this._columns = params.columns;
        this._tileCount = params.tileCount;
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

    get tileCount() {
        return this._tileCount;
    }

    createTile(scene, id) {
        let data = this._getData(id);

        let e = new Entity(scene);
        
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
        e.add(sprite, "TileSprite");
        let obj = new Map();
        for(let prop of (data == null ? [] : data.properties)) {
            obj.set(prop.name, prop.value);
        }
        e.props.set("tile-data", obj);

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

    addProp(id, name, value) {
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

    static loadFromTiledJSON(obj, image) {
        let tileset = new Tileset({
            image: image,
            tileWidth: obj.tilewidth,
            tileHeight: obj.tileheight,
            columns: obj.columns,
            tileCount: obj.tilecount
        });

        if(obj.tiles) {
            for(let data of obj.tiles) {
                const id = data.id;
                if(data.properties) {
                    for(let prop of data.properties) {
                        tileset.addProp(id, prop.name, prop.value);
                    }
                }
                if(data.animation) {
                    let frames = [];
                    for(let frame of data.animation) {
                        frames.push(frame.tileid);
                    }
                    tileset.addAnim(id, data.animation[0].duration, frames);
                }
            }
        }

        return tileset;
    }
}