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
    private data: Array<T> = new Array();

    get size(): number {
        return this.data.length;
    }

    constructor(data?: Array<T>) {
        if (data) {
            for (let val of data) {
                this.add(val);
            }
        }
    }

    [Symbol.iterator](): BSTSetIterator<T> {
        return this.entries();
    }

    add(...values: T[]): BSTSet<T> {
        for (let value of values) {
            let index = this.data.binarySearch(value);
            if (index < 0) {
                index = -(index + 1);
                this.data.insert(index, value);
            }
        }
        return this;
    }

    static union<T extends IOrdered>(left: BSTSet<T>, right: BSTSet<T>): BSTSet<T> {
        let result: BSTSet<T> = new BSTSet();

        let left_index = 0;
        let right_index = 0;
        while(left_index < left.data.length && right_index < right.data.length) {
            switch(left.data[left_index].compare(right.data[right_index])) {
                case Ordering.LessThan:
                    result.data.push(left.data[left_index++]);
                    break;
                case Ordering.GreaterThan:
                    result.data.push(right.data[right_index++]);
                    break;
                case Ordering.Equal:
                    left_index++;   // don't add identical
                    result.data.push(right.data[right_index++]);
                    break;
            }
        }
        while(left_index < left.data.length) {
            result.data.push(left.data[left_index++]);
        }
        while(right_index < right.data.length) {
            result.data.push(right.data[right_index++]);
        }

        return result;
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