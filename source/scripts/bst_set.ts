class BSTSetIterator<T extends IOrdered> {
    private iterator: Iterator<[number, T]>;

    constructor(iterator: Iterator<[number, T]>) {
        this.iterator = iterator;
    }

    next(): {value: T, done: boolean | undefined} {
        let entry = this.iterator.next();
        return {
            value: entry.value ? entry.value[1] : undefined,
            done: entry.done,
        };
    }
}

class BSTSet<T extends IOrdered> {
    private data: Array<T>;

    get size(): number {
        return this.data.length;
    }

    constructor(data?: Array<T>) {
        if (data) {
            this.data = data.clone();
            this.data.sort((a: T, b: T): Ordering => a.compare(b));
        } else {
            this.data = new Array();
        }
    }

    [Symbol.iterator](): BSTSetIterator<T> {
        return this.entries();
    }

    add(value: T): BSTSet<T> {
        let index = this.data.binarySearch(value);
        if (index < 0) {
            index = -(index + 1);
            this.data.insert(index, value);
        }
        return this;
    }

    merge(that: BSTSet<T>): BSTSet<T> {
        let retval: BSTSet<T> = new BSTSet();
        retval.data = this.data.merge(that.data);
        return retval;
    }

    clear(): undefined {
        this.data = new Array();
        return undefined;
    }

    delete(value: T): boolean {
        let index = this.data.binarySearch(value);
        if (index >= 0) {
            this.data.remove(index);
            return true;
        }
        return false;
    }

    entries(): BSTSetIterator<T> {
        return new BSTSetIterator(this.data.entries());
    }

    has(value: T): boolean {
        let index = this.data.binarySearch(value);
        return index >= 0;
    }

    values(): BSTSetIterator<T> {
        return this.entries();
    }
}