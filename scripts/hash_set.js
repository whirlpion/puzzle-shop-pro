"use strict";
class HashSetIterator {
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
        return { value: entry.value[1], done: false };
    }
}
class HashSet {
    get size() {
        return this._size;
    }
    constructor(values) {
        this.data = new Map();
        this._size = 0;
        this.hasher = new Hasher(new XXHash32(u32.ZERO));
        if (values) {
            for (let value of values) {
                this.add(value);
            }
        }
    }
    [Symbol.iterator]() {
        return this.entries();
    }
    add(value) {
        value.hash(this.hasher);
        const hash = this.hasher.finish().value;
        let entries = this.data.get(hash);
        if (entries) {
            for (let entry of entries) {
                if (value.equals(entry)) {
                    return this;
                }
            }
            entries.push(value);
        }
        else {
            this.data.set(hash, [value]);
        }
        this._size += 1;
        return this;
    }
    clear() {
        this.data.clear();
        this._size = 0;
        return undefined;
    }
    delete(value) {
        value.hash(this.hasher);
        const hash = this.hasher.finish().value;
        let entries = this.data.get(hash);
        if (!entries) {
            return false;
        }
        for (let k = 0; k < entries.length; k++) {
            if (value.equals(entries[k])) {
                entries.remove(k);
                this._size -= 1;
                if (entries.length == 0) {
                    this.data.delete(hash);
                }
                return true;
            }
        }
        return false;
    }
    entries() {
        return new HashSetIterator(this.data.entries());
    }
    has(value) {
        value.hash(this.hasher);
        const hash = this.hasher.finish().value;
        let entries = this.data.get(hash);
        if (entries) {
            for (let entry of entries) {
                if (value.equals(entry)) {
                    return true;
                }
            }
        }
        return false;
    }
    values() {
        return this.entries();
    }
}
