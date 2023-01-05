"use strict";
class HashMapIterator {
    constructor(bucketIterator) {
        this.entryIterator = null;
        this.bucketIterator = bucketIterator;
    }
    next() {
        if (!this.entryIterator) {
            let bucket = this.bucketIterator.next();
            if (bucket.done) {
                return { value: undefined, done: true };
            }
            this.entryIterator = bucket.value[1].entries();
        }
        throwIfNull(this.entryIterator);
        let entry = this.entryIterator.next();
        if (entry.done) {
            this.entryIterator = null;
            return this.next();
        }
        return { value: [entry.value[1].key, entry.value[1].value], done: false };
    }
}
class HashMapKeyIterator {
    constructor(iterator) {
        this.iterator = iterator;
    }
    next() {
        let record = this.iterator.next();
        if (record.done) {
            return {
                value: undefined,
                done: true
            };
        }
        return {
            value: record.value[0],
            done: false
        };
    }
}
class HashMapValueIterator {
    constructor(iterator) {
        this.iterator = iterator;
    }
    next() {
        let record = this.iterator.next();
        if (record.done) {
            return {
                value: undefined,
                done: true
            };
        }
        return {
            value: record.value[1],
            done: false
        };
    }
}
class HashMap {
    get size() {
        return this._size;
    }
    constructor(records) {
        this.data = new Map();
        this._size = 0;
        this.hasher = new Hasher(new XXHash32(u32.ZERO));
        if (!records) {
            return;
        }
        for (let [key, value] of records) {
            this.set(key, value);
        }
    }
    [Symbol.iterator]() {
        return this.entries();
    }
    clear() {
        this.data = new Map();
        this._size = 0;
        return undefined;
    }
    delete(key) {
        key.hash(this.hasher);
        const hash = this.hasher.finish().value;
        let entries = this.data.get(hash);
        if (!entries) {
            return false;
        }
        for (let k = 0; k < entries.length; k++) {
            if (key.equals(entries[k].key)) {
                entries.remove(k);
                if (entries.length == 0) {
                    this.data.delete(hash);
                }
                this._size -= 1;
                return true;
            }
        }
        return false;
    }
    entries() {
        return new HashMapIterator(this.data.entries());
    }
    get(key) {
        key.hash(this.hasher);
        const hash = this.hasher.finish().value;
        let entries = this.data.get(hash);
        if (!entries) {
            return undefined;
        }
        for (let entry of entries) {
            if (key.equals(entry.key)) {
                return entry.value;
            }
        }
        return undefined;
    }
    has(key) {
        if (this._size === 0) {
            return false;
        }
        key.hash(this.hasher);
        const hash = this.hasher.finish().value;
        let entries = this.data.get(hash);
        if (!entries) {
            return false;
        }
        for (let entry of entries) {
            if (key.equals(entry.key)) {
                return true;
            }
        }
        return false;
    }
    keys() {
        return new HashMapKeyIterator(this.entries());
    }
    set(key, value) {
        key.hash(this.hasher);
        const hash = this.hasher.finish().value;
        let entries = this.data.get(hash);
        if (!entries) {
            entries = new Array();
            this.data.set(hash, entries);
        }
        for (let entry of entries) {
            if (key.equals(entry.key)) {
                entry.value = value;
                return this;
            }
        }
        entries.push({ key, value });
        this._size += 1;
        return this;
    }
    values() {
        return new HashMapValueIterator(this.entries());
    }
}
