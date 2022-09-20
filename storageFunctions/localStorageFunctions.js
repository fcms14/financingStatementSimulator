import { StorageFunctions } from "./storageFunctions.js";

export class LocalStorageFunctions extends StorageFunctions{
    constructor(address){
        super();
        this.address = address;
        this.favs = JSON.parse(localStorage.getItem(this.address)) || null;
    }

    add(value) {        
        localStorage.setItem(this.address, JSON.stringify(super.add(value)));
        return this.favs;
    }
}