"use strict";
class Cell {
    get i() {
        return this._i;
    }
    get j() {
        return this._j;
    }
    constructor(i, j) {
        throwIfFalse(Number.isInteger(i) && i >= 0);
        throwIfFalse(Number.isInteger(j) && j >= 0);
        this._i = i;
        this._j = j;
    }
    static bresenhamLine(from, to) {
        let cells = [];
        let x = from.j;
        let y = from.i;
        let x1 = to.j;
        let y1 = to.i;
        let dx = Math.abs(x1 - x);
        let dy = Math.abs(y1 - y);
        let sx = (x < x1) ? 1 : -1;
        let sy = (y < y1) ? 1 : -1;
        let err = dx - dy;
        cells.push(from);
        while ((y != y1) || (x != x1)) {
            let e2 = 2 * err;
            if (e2 > -dy) {
                err -= dy;
                x += sx;
            }
            if (e2 < dx) {
                err += dx;
                y += sy;
            }
            cells.push(new Cell(y, x));
        }
        return cells;
    }
    compare(that) {
        if (this._i < that._i) {
            return Ordering.LessThan;
        }
        else if (this._i === that._i && this._j < that._j) {
            return Ordering.LessThan;
        }
        else if (this._i === that._i && this._j === that._j) {
            return Ordering.Equal;
        }
        else {
            return Ordering.GreaterThan;
        }
    }
    equals(that) {
        return this.i == that.i && this.j == that.j;
    }
    static fromXY(x, y) {
        let i = Math.floor(y / CELL_SIZE);
        let j = Math.floor(x / CELL_SIZE);
        return new Cell(i, j);
    }
    static fromMouseEvent(event) {
        return Cell.fromXY(event.offsetX, event.offsetY);
    }
    toString() {
        return `r${this.i}c${this.j}`;
    }
}
Cell.MAX_VAL = 0xFFFF;
var Direction;
(function (Direction) {
    Direction[Direction["Up"] = 0] = "Up";
    Direction[Direction["Right"] = 1] = "Right";
    Direction[Direction["Down"] = 2] = "Down";
    Direction[Direction["Left"] = 3] = "Left";
})(Direction || (Direction = {}));
var Digit;
(function (Digit) {
    Digit[Digit["One"] = 1] = "One";
    Digit[Digit["Two"] = 2] = "Two";
    Digit[Digit["Three"] = 3] = "Three";
    Digit[Digit["Four"] = 4] = "Four";
    Digit[Digit["Five"] = 5] = "Five";
    Digit[Digit["Size"] = 6] = "Size";
    Digit[Digit["Seven"] = 7] = "Seven";
    Digit[Digit["Eight"] = 8] = "Eight";
    Digit[Digit["Nine"] = 9] = "Nine";
})(Digit || (Digit = {}));
(function (Digit) {
    function parse(value) {
        let integer = Number.parseInt(value);
        throwIfTrue(isNaN(integer));
        throwIfFalse(integer >= 1 && integer <= 9);
        return integer;
    }
    Digit.parse = parse;
})(Digit || (Digit = {}));
class PencilMark {
    constructor(...digits) {
        this.digitFlags = 0;
        for (let digit of digits) {
            this.digitFlags |= (1 << digit);
        }
    }
    hasDigit(digit) {
        return (this.digitFlags & (1 << digit)) !== 0;
    }
}
class CellValue {
    // if a cell is locked, it becomes a constraint
    get locked() {
        return this._locked;
    }
    constructor() {
        this.digit = null;
        this.centerMark = new PencilMark();
        this.cornerMark = new PencilMark();
        this._locked = false;
    }
    lock() {
        this._locked = true;
    }
    unlock() {
        this._locked = false;
    }
}
;
