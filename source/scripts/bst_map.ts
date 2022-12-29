// A BSTMap<K,V> is an array of record sorted by K as defined by the IOrdered interface on K
// Best for small maps

class BSTMapRecord<K extends IOrdered, V> {
    key: K;
    value: V | undefined;

    constructor(key: K, value?: V) {
        this.key = key;
        this.value = value ? value : undefined;
    }

    cmp(that: BSTMapRecord<K, V>): Ordering {
        return this.key.cmp(that.key);
    }
}

class BSTMapRecordIterator<K extends IOrdered, V> {
    private iterator: Iterator<[number, BSTMapRecord<K,V>]>;

    constructor(iterator: Iterator<[number, BSTMapRecord<K,V>]>) {
        this.iterator = iterator;
    }

    next(): {value: [K, V], done: boolean | undefined} {
        let entry = this.iterator.next();
        return {
            value: entry.value ? [entry.value[1].key, entry.value[1].value] : [undefined, undefined],
            done: entry.done,
        };
    }
}

class BSTMapKeyIterator<K extends IOrdered, V> {
    private iterator: Iterator<[number, BSTMapRecord<K,V>]>;

    constructor(iterator: Iterator<[number, BSTMapRecord<K,V>]>) {
        this.iterator = iterator;
    }

    next(): {value: K, done: boolean | undefined} {
        let entry = this.iterator.next();
        return {
            value: entry.value ? entry.value[1].key : undefined,
            done: entry.done,
        };
    }
}

class BSTMapValueIterator<K extends IOrdered, V> {
    private iterator: Iterator<[number, BSTMapRecord<K,V>]>;

    constructor(iterator: Iterator<[number, BSTMapRecord<K,V>]>) {
        this.iterator = iterator;
    }

    next(): {value: V, done: boolean | undefined} {
        let entry = this.iterator.next();
        return {
            value: entry.value ? entry.value[1].value : undefined,
            done: entry.done,
        };
    }
}

class BSTMap<K extends IOrdered, V> {
    private data: Array<BSTMapRecord<K, V>> = new Array();

    constructor() {

    }

    get size(): number {
        return this.data.length;
    }

    [Symbol.iterator](): BSTMapRecordIterator<K,V>{
        return this.entries();
    }

    clear(): undefined {
        this.data = new Array();
        return undefined;
    }

    delete(key: K): boolean {
        let index = this.data.binarySearch(new BSTMapRecord<K, V>(key));
        if (index >= 0) {
            this.data.remove(index);
            return true;
        }
        return false;
    }

    entries(): BSTMapRecordIterator<K,V> {
        return new BSTMapRecordIterator(this.data.entries());
    }

    forEach(callback: {(value: V, key?: K, map?: BSTMap<K,V>): void}): undefined {
        for(let entry of this.data) {
             throwIfUndefined(entry.value);
             callback(entry.value, entry.key, this);
        }
        return  undefined;
    }

    get(key: K): V | undefined {
        let index = this.data.binarySearch(new BSTMapRecord<K, V>(key));
        if (index >= 0) {
            let value = this.data[index].value;
            throwIfUndefined(value);
            return value;
        }
        return undefined;
    }

    has(key: K): boolean {
        let index = this.data.binarySearch(new BSTMapRecord<K, V>(key));
        return index >= 0;
    }

    keys(): BSTMapKeyIterator<K,V> {
        return new BSTMapKeyIterator(this.data.entries());
    }

    set(key: K, value: V): BSTMap<K,V> {
        let record = new BSTMapRecord<K, V>(key, value);
        let index = this.data.binarySearch(record);
        if (index >= 0) {
            this.data[index] = record;
        } else {
            index = -(index + 1);
            this.data.insert(index, record);
        }
        return this;
    }

    values(): BSTMapValueIterator<K,V> {
        return new BSTMapValueIterator(this.data.entries());
    }
}