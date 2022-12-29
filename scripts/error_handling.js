"use strict";
function throwMessage(message) {
    throw new Error(message);
}
function throwIfEqual(left, right, message) {
    if (left === right) {
        throw new Error(message || `Values must not be equal: ${left}`);
    }
}
function throwIfNotEqual(left, right, message) {
    if (left !== right) {
        throw new Error(message || `Values must be equal: ${right} and ${left}`);
    }
}
function throwIfUndefined(val, message) {
    if (val === undefined) {
        throw new Error(message || "Value cannot be undefined");
    }
}
function throwIfNull(val, message) {
    if (val === null || val === undefined) {
        throw new Error(message || "Value cannot be null or undefined");
    }
}
function throwIfNotNull(val, message) {
    if (val !== null || val === undefined) {
        throw new Error(message || "Value must be null or undefined");
    }
}
function throwIfTrue(val, message) {
    if (val) {
        throw new Error(message || "Value cannot be true");
    }
}
function throwIfFalse(val, message) {
    if (!val) {
        throw new Error(message || "Value cannot be false");
    }
}
function throwIfEmpty(container, message) {
    if (container instanceof Array && container.length === 0) {
        throw new Error(message || "Array is empty");
    }
    else if (container instanceof Set && container.size === 0) {
        throw new Error(message || "Set is empty");
    }
    else if (container instanceof Map && container.size === 0) {
        throw new Error(message || "Map is empty");
    }
}
function throwIfNotEmpty(container, message) {
    if (container instanceof Array && container.length > 0) {
        throw new Error(message || "Array is not empty");
    }
    else if (container instanceof Set && container.size > 0) {
        throw new Error(message || "Set is not empty");
    }
    else if (container instanceof Map && container.size > 0) {
        throw new Error(message || "Map is not empty");
    }
}
function throwIfNotType(val, type) {
    if (!(val instanceof type)) {
        throw new Error(`Value must be an instance of ${type.name}`);
    }
}
