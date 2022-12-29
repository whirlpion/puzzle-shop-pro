"use strict";
class BSTSetIterator {
    constructor(iterator) {
        this.iterator = iterator;
    }
    next() {
        let entry = this.iterator.next();
        return {
            value: entry.value ? entry.value[1] : undefined,
            done: entry.done,
        };
    }
}
class BSTSet {
    get size() {
        return this.data.length;
    }
    constructor(data) {
        if (data) {
            this.data = data.clone();
            this.data.sort((a, b) => a.cmp(b));
        }
        else {
            this.data = new Array();
        }
    }
    [Symbol.iterator]() {
        return this.entries();
    }
    add(value) {
        let index = this.data.binarySearch(value);
        if (index < 0) {
            index = -(index + 1);
            this.data.insert(index, value);
        }
        return this;
    }
    merge(that) {
        let retval = new BSTSet();
        retval.data = this.data.merge(that.data);
        return retval;
    }
    clear() {
        this.data = new Array();
        return undefined;
    }
    delete(value) {
        let index = this.data.binarySearch(value);
        if (index >= 0) {
            this.data.remove(index);
            return true;
        }
        return false;
    }
    entries() {
        return new BSTSetIterator(this.data.entries());
    }
    has(value) {
        let index = this.data.binarySearch(value);
        return index >= 0;
    }
    values() {
        return this.entries();
    }
}
