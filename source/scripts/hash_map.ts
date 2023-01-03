class HashMapIterator<K extends IEquals & IHash, V> {
    private bucketIterator: Iterator<[number, Array<{key: K, value: V}>]>;
    private entryIterator: Iterator<[number, {key: K, value: V}]> | null = null;

    constructor(bucketIterator: Iterator<[number, Array<{key: K, value: V}>]>) {
        this.bucketIterator = bucketIterator;
    }

    next(): {value: [K, V], done: boolean} {
        if (!this.entryIterator) {
            let bucket = this.bucketIterator.next();
            if (bucket.done) {
                return { value: <[K, V]><unknown>undefined, done: true };
            }
            this.entryIterator = bucket.value[1].entries();
        }
        throwIfNull(this.entryIterator);
        let entry = this.entryIterator.next();
        if (entry.done) {
            this.entryIterator = null;
            return this.next();
        }
        return {value: [entry.value[1].key, entry.value[1].value], done: false};
    }
}

class HashMapKeyIterator<K extends IEquals & IHash, V> {
    private iterator: HashMapIterator<K, V>;

    constructor(iterator: HashMapIterator<K,V>) {
        this.iterator = iterator;
    }

    next(): {value: K, done: boolean} {
        let record = this.iterator.next();
        if (record.done) {
            return {
                value: <K><unknown>undefined,
                done: true
            };
        }
        return {
            value: record.value[0],
            done: false
        }
    }
}

class HashMapValueIterator<K extends IEquals & IHash, V> {
    private iterator: HashMapIterator<K, V>;

    constructor(iterator: HashMapIterator<K,V>) {
        this.iterator = iterator;
    }

    next(): {value: V, done: boolean} {
        let record = this.iterator.next();
        if (record.done) {
            return {
                value: <V><unknown>undefined,
                done: true
            };
        }
        return {
            value: record.value[1],
            done: false
        }
    }
}

class HashMap<K extends IEquals & IHash, V> {
    private data: Map<number, Array<{key: K, value: V}>> = new Map();
    private _size: number = 0;
    private hasher: Hasher<XXHash32> = new Hasher(new XXHash32(u32.ZERO));

    get size(): number {
        return this._size;
    }

    constructor(records?: [K, V][]) {
        if (!records) {
            return;
        }

        for (let [key, value] of records) {
            this.set(key, value);
        }
    }

    [Symbol.iterator](): HashMapIterator<K,V>{
        return this.entries();
    }

    clear(): undefined {
        this.data = new Map();
        this._size = 0;
        return undefined;
    }

    delete(key: K) {
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

    entries(): HashMapIterator<K,V> {
        return new HashMapIterator(this.data.entries());
    }

    get(key: K): V | undefined {
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

    has(key: K): boolean {
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

    keys(): HashMapKeyIterator<K,V> {
        return new HashMapKeyIterator(this.entries());
    }

    set(key: K, value: V): HashMap<K,V> {
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
        entries.push({key, value});
        this._size += 1;
        return this;
    }

    values(): HashMapValueIterator<K,V> {
        return new HashMapValueIterator(this.entries());
    }
}