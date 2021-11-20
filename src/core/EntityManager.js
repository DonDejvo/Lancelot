export class EntityManager {

    _entities = [];
    _entitiesMap = new Map();
    _ids = 0;

    _generateName() {
        ++this._ids;
        return "__entity__" + this._ids;
    }
    add(e, n) {
        if (n === undefined) {
            n = this._generateName();
        }
        this._entities.push(e);
        this._entitiesMap.set(n, e);
        e._parent = this;
        e._name = n;
    }
    get(n) {
        return this._entitiesMap.get(n);
    }
    remove(e) {
        const i = this._entities.indexOf(e);
        if (i < 0) {
            return;
        }
        this._entities.splice(i, 1);
    }
    filter(cb) {
        return this._entities.filter(cb);
    }
    update(elapsedTimeS) {
        for (let e of this._entities) {
            e.update(elapsedTimeS);
        }
    }
}