"use strict";
class Cell {
    get i() {
        return this._i;
    }
    get j() {
        return this._j;
    }
    // top of the cell region in world coordinates
    get top() {
        return this.i * CELL_SIZE;
    }
    // bottom of the cell region in world coordinates
    get bottom() {
        return (this.i + 1) * CELL_SIZE;
    }
    // left side of the cell region in world coordinates
    get left() {
        return this.j * CELL_SIZE;
    }
    // right side of the cell region in world coordinates
    get right() {
        return (this.j + 1) * CELL_SIZE;
    }
    // the horizontal,vertical center of the cell region in world coordinates
    get center() {
        return { x: (this.j + 0.5) * CELL_SIZE, y: (this.i + 0.5) * CELL_SIZE };
    }
    get northNeighbor() {
        return new Cell(this.i - 1, this.j);
    }
    get northEastNeighbor() {
        return new Cell(this.i - 1, this.j + 1);
    }
    get eastNeighbor() {
        return new Cell(this.i, this.j + 1);
    }
    get southEastNeighbor() {
        return new Cell(this.i + 1, this.j + 1);
    }
    get southNeighbor() {
        return new Cell(this.i + 1, this.j);
    }
    get southWestNeighbor() {
        return new Cell(this.i + 1, this.j - 1);
    }
    get westNeighbor() {
        return new Cell(this.i, this.j - 1);
    }
    get northWestNeighbor() {
        return new Cell(this.i - 1, this.j - 1);
    }
    get orthogonalNeighbors() {
        return [
            this.northNeighbor,
            this.eastNeighbor,
            this.southNeighbor,
            this.westNeighbor,
        ];
    }
    get diagonalNeighbors() {
        return [
            this.northEastNeighbor,
            this.southEastNeighbor,
            this.southWestNeighbor,
            this.northWestNeighbor,
        ];
    }
    get neighbors() {
        return [
            this.northNeighbor,
            this.northEastNeighbor,
            this.eastNeighbor,
            this.southEastNeighbor,
            this.southNeighbor,
            this.southWestNeighbor,
            this.westNeighbor,
            this.northWestNeighbor,
        ];
    }
    constructor(i, j) {
        throwIfFalse(Number.isInteger(i));
        throwIfFalse(Number.isInteger(j));
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
    static manhattanDistance(left, right) {
        return Math.abs(left.i - right.i) + Math.abs(left.j - right.j);
    }
    adjacentOrthogonal(that) {
        return Cell.manhattanDistance(this, that) == 1;
    }
    adjacentDiagonal(that) {
        return (this.i != that.i && this.j != that.j) &&
            Cell.manhattanDistance(this, that) == 2;
    }
    adjacentKingsMove(that) {
        return this.adjacentOrthogonal(that) || this.adjacentDiagonal(that);
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
    Digit[Digit["Six"] = 6] = "Six";
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
var DigitFlag;
(function (DigitFlag) {
    DigitFlag[DigitFlag["None"] = 0] = "None";
    DigitFlag[DigitFlag["One"] = 1] = "One";
    DigitFlag[DigitFlag["Two"] = 2] = "Two";
    DigitFlag[DigitFlag["Three"] = 4] = "Three";
    DigitFlag[DigitFlag["Four"] = 8] = "Four";
    DigitFlag[DigitFlag["Five"] = 16] = "Five";
    DigitFlag[DigitFlag["Six"] = 32] = "Six";
    DigitFlag[DigitFlag["Seven"] = 64] = "Seven";
    DigitFlag[DigitFlag["Eight"] = 128] = "Eight";
    DigitFlag[DigitFlag["Nine"] = 256] = "Nine";
})(DigitFlag || (DigitFlag = {}));
(function (DigitFlag) {
    function fromDigit(digit) {
        return (1 << (digit - 1));
    }
    DigitFlag.fromDigit = fromDigit;
    function toString(flag) {
        return DigitFlag.toDigits(flag).join("");
    }
    DigitFlag.toString = toString;
    function toDigits(flag) {
        let digits = new Array();
        for (let k = Digit.One; k <= Digit.Nine; k++) {
            if (flag & DigitFlag.fromDigit(k)) {
                digits.push(k);
            }
        }
        return digits;
    }
    DigitFlag.toDigits = toDigits;
})(DigitFlag || (DigitFlag = {}));
class CellValue {
    // if a cell is locked, it becomes a constraint
    get locked() {
        return this._locked;
    }
    constructor() {
        this.digit = null;
        this.centerMark = DigitFlag.None;
        this.cornerMark = DigitFlag.None;
        this.colourMark = DigitFlag.None;
        this._locked = false;
    }
    clone() {
        let retval = new CellValue();
        retval.digit = this.digit;
        retval.centerMark = this.centerMark;
        retval.cornerMark = this.cornerMark;
        retval.colourMark = this.colourMark;
        retval._locked = this._locked;
        return retval;
    }
    lock() {
        this._locked = true;
    }
    unlock() {
        this._locked = false;
    }
    equals(that) {
        return this.digit == that.digit &&
            this.centerMark == that.centerMark &&
            this.cornerMark == that.cornerMark &&
            this.colourMark == that.colourMark &&
            this._locked == that._locked;
    }
}
;
