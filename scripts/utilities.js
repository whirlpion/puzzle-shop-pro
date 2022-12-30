"use strict";
var Ordering;
(function (Ordering) {
    Ordering[Ordering["LessThan"] = -1] = "LessThan";
    Ordering[Ordering["Equal"] = 0] = "Equal";
    Ordering[Ordering["GreaterThan"] = 1] = "GreaterThan";
})(Ordering || (Ordering = {}));
function makeComparator() {
    return (left, right) => {
        return left.cmp(right);
    };
}
// returns index of location of value, or -(index + 1) for insertion point
Array.prototype.binarySearch = function (value) {
    throwIfTrue(value.cmp === undefined);
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
};
Array.prototype.clone = function () {
    return this.slice();
};
Array.prototype.insert = function (index, ...values) {
    this.splice(index, 0, ...values);
};
Array.prototype.remove = function (index) {
    this.splice(index, 1);
};
Array.prototype.merge = function (that) {
    let merged = new Array();
    let this_index = 0;
    let that_index = 0;
    while (this_index < this.length && that_index < that.length) {
        switch (this[this_index].cmp(that[that_index])) {
            case Ordering.LessThan:
                merged.push(this[this_index++]);
                break;
            case Ordering.GreaterThan:
            case Ordering.Equal:
                merged.push(that[that_index++]);
                break;
        }
    }
    while (this_index < this.length) {
        merged.push(this[this_index]);
    }
    while (that_index < that.length) {
        merged.push(that[that_index]);
    }
    return merged;
};
Array.collect = function (it) {
    let data = new Array();
    for (let entry = it.next(); !entry.done; entry = it.next()) {
        data.push(entry.value);
    }
    return data;
};
String.prototype.toSnakeCase = function () {
    return this.replace(/[a-z0-9]([A-Z])/g, (match) => `${match.charAt(0)}_${match.charAt(1)}`).toLowerCase();
};
String.prototype.cmp = function (_that) {
    throwMessage("Not Implemented");
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
