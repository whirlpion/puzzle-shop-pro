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
    [Symbol.iterator]() {
        return this;
    }
}
class BSTSet {
    get size() {
        return this.data.length;
    }
    constructor(data) {
        this.data = new Array();
        if (data) {
            for (let val of data) {
                this.add(val);
            }
        }
    }
    [Symbol.iterator]() {
        return this.entries();
    }
    add(...values) {
        for (let value of values) {
            let index = this.data.binarySearch(value);
            if (index < 0) {
                index = -(index + 1);
                this.data.insert(index, value);
            }
        }
        return this;
    }
    static union(left, right) {
        let result = new BSTSet();
        let left_index = 0;
        let right_index = 0;
        while (left_index < left.data.length && right_index < right.data.length) {
            switch (left.data[left_index].compare(right.data[right_index])) {
                case Ordering.LessThan:
                    result.data.push(left.data[left_index++]);
                    break;
                case Ordering.GreaterThan:
                    result.data.push(right.data[right_index++]);
                    break;
                case Ordering.Equal:
                    left_index++; // don't add identical
                    result.data.push(right.data[right_index++]);
                    break;
            }
        }
        while (left_index < left.data.length) {
            result.data.push(left.data[left_index++]);
        }
        while (right_index < right.data.length) {
            result.data.push(right.data[right_index++]);
        }
        return result;
    }
    clear() {
        this.data = new Array();
        return undefined;
    }
    delete(...values) {
        let result = false;
        for (let value of values) {
            let index = this.data.binarySearch(value);
            if (index >= 0) {
                this.data.remove(index);
                result = true;
            }
        }
        return result;
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
