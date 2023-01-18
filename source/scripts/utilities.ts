enum Ordering {
    LessThan = -1,
    Equal = 0,
    GreaterThan = 1,
}

interface IOrdered {
    compare(that: IOrdered): Ordering;
}

interface IEquals {
    equals(that: IEquals): boolean;
}

function makeComparator<T extends IOrdered>(): (left: T, right: T) => Ordering {
    return (left: T, right: T): Ordering => {
        return left.compare(right);
    };
}

interface Array<T> {
    binarySearch<T extends IOrdered>(value: T): number;
    clear(): void;
    clone(): Array<T>;
    compare<T extends IOrdered>(that: Array<T>): Ordering;
    equals<T extends IEquals>(that: Array<T>): boolean;
    first(): T | undefined;
    insert(index: number, ...values: T[]): void;
    last(): T | undefined;
    remove(index: number): void;
}

// returns index of location of value, or -(index + 1) for insertion point
Array.prototype.binarySearch = function<T extends IOrdered>(this: Array<T>, value: T): number {
    let left = 0;
    let right = this.length - 1;
    while (left <= right) {
        let middle = Math.floor((left + right) / 2);
        switch (this[middle].compare(value)) {
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

Array.prototype.compare = function<T extends IOrdered>(this: Array<T>, that: Array<T>): Ordering {
    if (this === that) {
        return Ordering.Equal;
    }

    const length = Math.min(this.length, that.length);
    for(let k = 0; k < length; k++) {
        let ord = this[k].compare(that[k]);
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

Array.prototype.equals = function<T extends IEquals>(this: Array<T>, that: Array<T>): boolean {
    if (this === that) {
        return true;
    }

    if (this.length !== that.length) {
        return false;
    }

    const length = this.length;
    for (let k = 0; k < length; k++) {
        if (!this[k].equals(that[k])) {
            return false;
        }
    }
    return true;
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

interface SetConstructor {
    union<T>(left: Set<T>, right: Set<T>): Set<T>;
}

Set.union = function<T>(left: Set<T>, right: Set<T>): Set<T> {
    let result: Set<T> = new Set();
    for (let val of left ) {
        result.add(val);
    }
    for (let val of right) {
        result.add(val);
    }
    return result;
}


// String

interface String {
    // convert camelCase or PascalCase to snake_case
    toSnakeCase(): string;
    compare(that: string): Ordering
    equals(that: string): boolean;
}

String.prototype.toSnakeCase = function(): string {
    return this.replace(/[a-z0-9]([A-Z])/g, (match: string) => `${match.charAt(0)}_${match.charAt(1)}`).toLowerCase();
}

String.prototype.compare = function(that: string): Ordering {
    if (this < that) {
        return Ordering.LessThan;
    } else if (this > that) {
        return Ordering.GreaterThan;
    } else {
        return Ordering.Equal;
    }
}

String.prototype.equals = function(that: string): boolean {
    return this === that;
}

// Number

interface Number {
    compare(that: number): Ordering;
    equals(that: number): boolean;
}

Number.prototype.compare = function(that: number): Ordering {
    return Math.sign(this.valueOf() - that);
}

Number.prototype.equals = function(that: number): boolean {
    return this === that;
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

// Navigator

interface Navigator {
    isMacOS: boolean;
}

Navigator.prototype.isMacOS = globalThis.navigator.userAgent.includes("Mac OS");

// GestureEvent

interface GestureEvent extends UIEvent {
    scale: number;
}

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

// Wheel Event

interface WheelEvent {
    // abstract away control vs command
    get shortcutKey(): boolean;
}

if (globalThis.navigator.isMacOS) {
    Object.defineProperty(WheelEvent.prototype, "shortcutKey", {
        get:function(): boolean {
            return this.metaKey;
        }});
} else {
    Object.defineProperty(WheelEvent.prototype, "shortcutKey", {
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
