export class SceneManager {

    _scenes = [];

    get scenes() {
        return this._scenes.map((e) => e.scene);
    }

    add(scene, name, zIndex = 0) {
        let wrapper = {
            scene: scene,
            name: name,
            zIndex: zIndex
        };
        this._scenes.push(wrapper);
        for (let i = this._scenes.length - 1; i > 0; --i) {
            if (wrapper.zIndex < this._scenes[i - 1].zIndex) {
                break;
            }
            [this._scenes[i], this._scenes[i - 1]] = [this._scenes[i - 1], this._scenes[i]];
        }
    }

    get(name) {
        return this._scenes.find((e) => e.name == name).scene;
    }

    setZIndex(name, zIndex) {
        const scene = this.get(name);
        if(scene) {
            this.remove(name);
            this.add(scene, name, zIndex);
        }

    }

    remove(name) {
        const idx = this._scenes.findIndex((e) => e.name == name);
        if(idx != -1) {
            this._scenes.splice(idx, 1);
            return true;
        }
        return false;
    }
}