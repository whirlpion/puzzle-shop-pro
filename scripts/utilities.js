"use strict";
var Ordering;
(function (Ordering) {
    Ordering[Ordering["LessThan"] = -1] = "LessThan";
    Ordering[Ordering["Equal"] = 0] = "Equal";
    Ordering[Ordering["GreaterThan"] = 1] = "GreaterThan";
})(Ordering || (Ordering = {}));
function makeComparator() {
    return (left, right) => {
        return left.compare(right);
    };
}
// returns index of location of value, or -(index + 1) for insertion point
Array.prototype.binarySearch = function (value) {
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
};
Array.prototype.clear = function () {
    this.length = 0;
};
Array.prototype.clone = function () {
    return this.slice();
};
Array.prototype.compare = function (that) {
    if (this === that) {
        return Ordering.Equal;
    }
    const length = Math.min(this.length, that.length);
    for (let k = 0; k < length; k++) {
        let ord = this[k].compare(that[k]);
        if (ord != Ordering.Equal) {
            return ord;
        }
    }
    if (this.length < that.length) {
        return Ordering.LessThan;
    }
    else if (this.length > that.length) {
        return Ordering.GreaterThan;
    }
    else {
        return Ordering.Equal;
    }
};
Array.prototype.equals = function (that) {
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
};
Array.prototype.first = function () {
    if (this.length > 0) {
        return this[0];
    }
    return undefined;
};
Array.prototype.insert = function (index, ...values) {
    this.splice(index, 0, ...values);
};
Array.prototype.last = function () {
    if (this.length > 0) {
        return this[this.length - 1];
    }
    return undefined;
};
Array.prototype.remove = function (index) {
    this.splice(index, 1);
};
Array.collect = function (it) {
    let data = new Array();
    for (let entry = it.next(); !entry.done; entry = it.next()) {
        data.push(entry.value);
    }
    return data;
};
Set.union = function (left, right) {
    let result = new Set();
    for (let val of left) {
        result.add(val);
    }
    for (let val of right) {
        result.add(val);
    }
    return result;
};
String.prototype.toSnakeCase = function () {
    return this.replace(/[a-z0-9]([A-Z])/g, (match) => `${match.charAt(0)}_${match.charAt(1)}`).toLowerCase();
};
String.prototype.compare = function (that) {
    if (this < that) {
        return Ordering.LessThan;
    }
    else if (this > that) {
        return Ordering.GreaterThan;
    }
    else {
        return Ordering.Equal;
    }
};
String.prototype.equals = function (that) {
    return this === that;
};
Number.prototype.compare = function (that) {
    return Math.sign(this.valueOf() - that);
};
Number.prototype.equals = function (that) {
    return this === that;
};
Math.clamp = (min, val, max) => {
    return Math.min(max, Math.max(min, val));
};
Math.sign = (val) => {
    if (val > 0) {
        return 1;
    }
    else if (val < 0) {
        return -1;
    }
    return 0;
};
Node.prototype.clearChildren = function () {
    while (this.lastChild) {
        this.removeChild(this.lastChild);
    }
};
Element.prototype.setAttributes = function (...nameValuePairs) {
    for (let [name, value] of nameValuePairs) {
        this.setAttribute(name, value);
    }
};
Navigator.prototype.isMacOS = globalThis.navigator.userAgent.includes("Mac OS");
Object.defineProperty(MouseEvent.prototype, "primaryButton", {
    get: function () {
        return this.buttons & 1 ? true : false;
    }
});
Object.defineProperty(MouseEvent.prototype, "secondaryButton", {
    get: function () {
        return this.buttons & 2 ? true : false;
    }
});
if (globalThis.navigator.isMacOS) {
    Object.defineProperty(MouseEvent.prototype, "shortcutKey", {
        get: function () {
            return this.metaKey;
        }
    });
}
else {
    Object.defineProperty(MouseEvent.prototype, "shortcutKey", {
        get: function () {
            return this.ctrlKey;
        }
    });
}
if (globalThis.navigator.isMacOS) {
    Object.defineProperty(WheelEvent.prototype, "shortcutKey", {
        get: function () {
            return this.metaKey;
        }
    });
}
else {
    Object.defineProperty(WheelEvent.prototype, "shortcutKey", {
        get: function () {
            return this.ctrlKey;
        }
    });
}
if (globalThis.navigator.isMacOS) {
    Object.defineProperty(KeyboardEvent.prototype, "shortcutKey", {
        get: function () {
            return this.metaKey;
        }
    });
}
else {
    Object.defineProperty(KeyboardEvent.prototype, "shortcutKey", {
        get: function () {
            return this.ctrlKey;
        }
    });
}
