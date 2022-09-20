export class StorageFunctions {
    constructor() {
        this.favs = null;
    }
    load() {
        return this.favs;
    }
    add(value) {
        this.favs = value;
        return this.favs
    }
}