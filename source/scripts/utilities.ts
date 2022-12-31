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
    clear(): void;
    clone(): Array<T>;
    cmp<T extends IOrdered>(that: Array<T>): Ordering;
    first(): T | undefined;
    insert(index: number, ...values: T[]): void;
    last(): T | undefined;
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

Array.prototype.clear = function(): void {
    this.length = 0;
}

Array.prototype.clone = function<T>(): Array<T> {
    return this.slice();
}

Array.prototype.cmp = function<T extends IOrdered>(this: Array<T>, that: Array<T>): Ordering {
    const length = Math.min(this.length, that.length);
    for(let k = 0; k < length; k++) {
        let ord = this[k].cmp(that[k]);
        if (ord != Ordering.Equal) {
            return ord;
        }
    }

    if (this.length < that.length) {
        return Ordering.LessThan;
    } else if (this.length > that.length) {
        return Ordering.GreaterThan;
    } else {
        return Ordering.Equal;
    }
}

Array.prototype.first = function<T>(this: Array<T>): T | undefined {
    if (this.length > 0) {
        return this[0];
    }
    return undefined;
}

Array.prototype.insert = function<T>(this: Array<T>, index: number, ...values: T[]): void {
    this.splice(index, 0, ...values);
}

Array.prototype.last = function<T>(this: Array<T>): T | undefined {
    if (this.length > 0) {
        return this[this.length - 1];
    }
    return undefined;
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
        merged.push(this[this_index++]);
    }
    while(that_index < that.length) {
        merged.push(that[that_index++]);
    }
    return merged;
}

interface ArrayConstructor {
    collect<T>(iterator: Iterator<T>): Array<T>;
}

Array.collect = function<T>(it: Iterator<T>): Array<T> {
    let data: Array<T> = new Array();
    for(let entry = it.next(); !entry.done; entry = it.next()) {
        data.push(entry.value);
    }
    return data;
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

String.prototype.cmp = function(that: string): Ordering {
    if (this < that) {
        return Ordering.LessThan;
    } else if (this > that) {
        return Ordering.GreaterThan;
    } else {
        return Ordering.Equal;
    }
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

// Number

interface Number {
    cmp(that: number): Ordering;
}

Number.prototype.cmp = function(that: number): Ordering {
    return Math.sign(this.valueOf() - that);
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

// Navigator

interface Navigator {
    isMacOS: boolean;
}

Navigator.prototype.isMacOS = globalThis.navigator.userAgent.includes("Mac OS");

// MouseEvent

interface MouseEvent {
    // abstract away control vs command
    get shortcutKey(): boolean;
    // is primary button pressed
    get primaryButton(): boolean;
    // is secondary button pressed
    get secondaryButton(): boolean;
}

Object.defineProperty(MouseEvent.prototype, "primaryButton", {
    get:function(): boolean {
        return this.buttons & 1 ? true : false;
    }});

Object.defineProperty(MouseEvent.prototype, "secondaryButton", {
    get:function(): boolean {
        return this.buttons & 2 ? true : false;
    }});

if (globalThis.navigator.isMacOS) {
    Object.defineProperty(MouseEvent.prototype, "shortcutKey", {
        get:function(): boolean {
            return this.metaKey;
        }});
} else {
    Object.defineProperty(MouseEvent.prototype, "shortcutKey", {
        get:function(): boolean {
            return this.ctrlKey;
        }});
}

// KeyboardEvent

interface KeyboardEvent {
    get shortcutKey(): boolean;
}

if (globalThis.navigator.isMacOS) {
    Object.defineProperty(KeyboardEvent.prototype, "shortcutKey", {
        get:function(): boolean {
            return this.metaKey;
        }});
} else {
    Object.defineProperty(KeyboardEvent.prototype, "shortcutKey", {
        get:function(): boolean {
            return this.ctrlKey;
        }});
}
