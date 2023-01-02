

class HashSetIterator<T extends IEquals & IHash> {
    private bucketIterator: Iterator<[string,Array<T>]>
    private entryIterator: Iterator<[number, T]> | null = null;

    constructor(bucketIterator: Iterator<[string,Array<T>]>) {
        this.bucketIterator = bucketIterator;
    }

    next(): {value: T, done: boolean} {
        if (!this.entryIterator) {
            let bucket = this.bucketIterator.next();
            if (bucket.done) {
                return { value: <T><unknown>undefined, done: true };
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

class HashSet<T extends IEquals & IHash> {
    private data: Map<string,Array<T>> = new Map();
    private _size: number= 0;
    private hasher: Hasher<XXHash32> = new Hasher(new XXHash32(u32.ZERO));

    get size(): number {
        return this._size;
    }

    constructor(values?: T[]) {
        if (values) {
            for (let value of values) {
                this.add(value);
            }
        }
    }

    [Symbol.iterator](): HashSetIterator<T> {
        return this.entries();
    }

    add(value: T): HashSet<T> {
        value.hash(this.hasher);
        const hash = this.hasher.finish();
        const key = hash.toString();

        let entries = this.data.get(key);
        if (entries) {
            for (let entry of entries) {
                if (value.equals(entry)) {
                    return this;
                }
            }
            entries.push(value);
        } else {
            this.data.set(key,[value]);
        }
        this._size += 1;
        return this;
    }

    clear(): undefined {
        this.data.clear();
        this._size = 0;
        return undefined;
    }

    delete(value: T): boolean {
        value.hash(this.hasher);
        const hash = this.hasher.finish();
        const key = hash.toString();

        let entries = this.data.get(key);
        if(!entries) {
            return false;
        }
        for (let k = 0; k < entries.length; k++) {
            if (value.equals(entries[k])) {
                entries.remove(k);
                this._size -= 1;
                if (entries.length == 0) {
                    this.data.delete(key);
                }
                return true;
            }
        }
        return false;
    }

    entries(): HashSetIterator<T> {
        return new HashSetIterator(this.data.entries());
    }

    has(value: T): boolean {
        value.hash(this.hasher);
        const hash = this.hasher.finish();
        const key = hash.toString();

        let entries = this.data.get(key);
        if (entries) {
            for (let entry of entries) {
                if (value.equals(entry)) {
                    return true;
                }
            }
        }
        return false;
    }

    values(): HashSetIterator<T> {
        return this.entries();
    }
}