export class EntityManager {
    constructor() {
        this._entities = [];
        this._entitiesMap = new Map();
        this._ids = 0;
    }
    _GenerateName() {
        ++this._ids;
        return "__entity__" + this._ids;
    }
    Add(e, n) {
        if (n === undefined) {
            n = this._GenerateName();
        }
        this._entities.push(e);
        this._entitiesMap.set(n, e);
        e._parent = this;
        e._name = n;
    }
    Get(n) {
        return this._entitiesMap.get(n);
    }
    Remove(e) {
        const i = this._entities.indexOf(e);
        if (i < 0) {
            return;
        }
        this._entities.splice(i, 1);
    }
    Filter(cb) {
        return this._entities.filter(cb);
    }
    Update(elapsedTimeS) {
        for (let e of this._entities) {
            e.Update(elapsedTimeS);
        }
    }
}