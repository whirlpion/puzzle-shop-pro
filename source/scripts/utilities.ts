enum Ordering {
    LessThan = -1,
    Equal = 0,
    GreaterThan = 1,
}

interface IOrdered {
    cmp(that: IOrdered): Ordering;
}

function makeComparator<T extends IOrdered>(): (left: T, right: T) => Ordering {
    return (left: T, right: T): Ordering => {
        return left.cmp(right);
    };
}

interface Array<T> {
    binarySearch<T extends IOrdered>(value: T): number;
    clone(): Array<T>;
    insert(index: number, ...values: T[]): void;
    merge<T extends IOrdered>(that: Array<T>): Array<T>;
    remove(index: number): void;
}

// returns index of location of value, or -(index + 1) for insertion point
Array.prototype.binarySearch = function<T extends IOrdered>(this: Array<T>, value: T): number {
    throwIfTrue((value as IOrdered).cmp === undefined);

    let left = 0;
    let right = this.length - 1;
    while (left <= right) {
        let middle = Math.floor((left + right) / 2);
        switch (this[middle].cmp(value)) {
        case Ordering.LessThan:
            left = middle + 1;
            break;
        case Ordering.GreaterThan:
            right = middle - 1;
            break;
        case Ordering.Equal:
            return middle;
        }
    }
    return -(left + 1);
}

Array.prototype.clone = function<T>(): Array<T> {
    return this.slice();
}

Array.prototype.insert = function<T>(this: Array<T>, index: number, ...values: T[]): void {
    this.splice(index, 0, ...values);
}

Array.prototype.remove = function<T>(this: Array<T>, index: number): void {
    this.splice(index, 1);
}

Array.prototype.merge = function<T extends IOrdered>(this: Array<T>, that: Array<T>): Array<T> {
    let merged: Array<T> = new Array();
    let this_index = 0;
    let that_index = 0;
    while(this_index < this.length && that_index < that.length) {
        switch(this[this_index].cmp(that[that_index])) {
            case Ordering.LessThan:
                merged.push(this[this_index++]);
                break;
            case Ordering.GreaterThan:
            case Ordering.Equal:
                merged.push(that[that_index++]);
                break;
        }
    }
    while(this_index < this.length) {
        merged.push(this[this_index]);
    }
    while(that_index < that.length) {
        merged.push(that[that_index]);
    }
    return merged;
}

// String

interface String {
    // convert camelCase or PascalCase to snake_case
    toSnakeCase(): string;
    cmp(that_: string): Ordering
}

String.prototype.toSnakeCase = function(): string {
    return this.replace(/[a-z0-9]([A-Z])/g, (match: string) => `${match.charAt(0)}_${match.charAt(1)}`).toLowerCase();
}

String.prototype.cmp = function(_that: string): Ordering {
    throwMessage("Not Implemented");
}

// Math

interface Math {
    // clamp a value between min and max
    clamp(min: number, val: number, max: number): number;

    // -1 for negative, 0 for 0, 1 for positive
    sign(val: number): number;
}

Math.clamp = (min: number, val: number, max: number): number => {
    return Math.min(max, Math.max(min, val));
}

Math.sign = (val: number): number => {
    if (val > 0) {
        return 1;
    } else if (val < 0) {
        return -1;
    }
    return 0;
}

// Node

interface Node {
    // remove all of the children from a Node
    clearChildren(): void;
}

Node.prototype.clearChildren = function(): void {
    while(this.lastChild) {
        this.removeChild(this.lastChild);
    }
}

// Element

interface Element {
    // sets multiple attributes at once
    setAttributes(...nameValuePairs: [string, string][]): void;
}

Element.prototype.setAttributes = function(...nameValuePairs: [string, string][]): void {
    for (let [name, value] of nameValuePairs) {
        this.setAttribute(name, value);
    }
}

// MouseEvent

interface MouseEvent {
    get shortcutKey(): boolean;
}

// KeyboardEvent

interface KeyboardEvent {
    get shortcutKey(): boolean;
}

if (globalThis.navigator.userAgent.includes("Mac OS")) {
    Object.defineProperty(MouseEvent.prototype, "shortcutKey", {
        get:function(): boolean{
            return this.metaKey;
        }});

    Object.defineProperty(KeyboardEvent.prototype, "shortcutKey", {
        get:function(): boolean{
            return this.metaKey;
        }});
} else {
    Object.defineProperty(MouseEvent.prototype, "shortcutKey", {
        get:function(): boolean{
            return this.ctrlKey;
        }});

    Object.defineProperty(KeyboardEvent.prototype, "shortcutKey", {
        get:function(): boolean{
            return this.ctrlKey;
        }});
}
