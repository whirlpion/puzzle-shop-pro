"use strict";
// A BSTMap<K,V> is an array of record sorted by K as defined by the IOrdered interface on K
// Best for small maps
class BSTMapRecord {
    constructor(key, value) {
        this.key = key;
        this.value = value ? value : undefined;
    }
    compare(that) {
        return this.key.compare(that.key);
    }
}
class BSTMapRecordIterator {
    constructor(iterator) {
        this.iterator = iterator;
    }
    next() {
        let entry = this.iterator.next();
        return {
            value: entry.value ? [entry.value[1].key, entry.value[1].value] : [undefined, undefined],
            done: entry.done,
        };
    }
}
class BSTMapKeyIterator {
    constructor(iterator) {
        this.iterator = iterator;
    }
    next() {
        let entry = this.iterator.next();
        return {
            value: entry.value ? entry.value[1].key : undefined,
            done: entry.done,
        };
    }
}
class BSTMapValueIterator {
    constructor(iterator) {
        this.iterator = iterator;
    }
    next() {
        let entry = this.iterator.next();
        return {
            value: entry.value ? entry.value[1].value : undefined,
            done: entry.done,
        };
    }
}
class BSTMap {
    constructor() {
        this.data = new Array();
    }
    get size() {
        return this.data.length;
    }
    [Symbol.iterator]() {
        return this.entries();
    }
    clear() {
        this.data = new Array();
        return undefined;
    }
    delete(key) {
        let index = this.data.binarySearch(new BSTMapRecord(key));
        if (index >= 0) {
            this.data.remove(index);
            return true;
        }
        return false;
    }
    entries() {
        return new BSTMapRecordIterator(this.data.entries());
    }
    forEach(callback) {
        for (let entry of this.data) {
            throwIfUndefined(entry.value);
            callback(entry.value, entry.key, this);
        }
        return undefined;
    }
    get(key) {
        let index = this.data.binarySearch(new BSTMapRecord(key));
        if (index >= 0) {
            let value = this.data[index].value;
            throwIfUndefined(value);
            return value;
        }
        return undefined;
    }
    has(key) {
        let index = this.data.binarySearch(new BSTMapRecord(key));
        return index >= 0;
    }
    keys() {
        return new BSTMapKeyIterator(this.data.entries());
    }
    set(key, value) {
        let record = new BSTMapRecord(key, value);
        let index = this.data.binarySearch(record);
        if (index >= 0) {
            this.data[index] = record;
        }
        else {
            index = -(index + 1);
            this.data.insert(index, record);
        }
        return this;
    }
    values() {
        return new BSTMapValueIterator(this.data.entries());
    }
}
