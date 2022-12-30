"use strict";
// a puzzle object is the 'owner' of the visual and logical aspects of a puzzle piece
class IConstraint {
    // cloneCells(): Array<Cell> {
    //     return this._cells.clone();
    // }
    get cells() {
        return this._cells;
    }
    get svg() {
        throwIfNull(this._svg);
        return this._svg;
    }
    //  takes in a list of cells affected by this constraint and a puzzle grid
    constructor(cells, svg) {
        this._cells = cells;
        this._svg = svg;
    }
}
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
    static fromXY(x, y) {
        let i = Math.floor(y / CELL_SIZE);
        let j = Math.floor(x / CELL_SIZE);
        return new Cell(i, j);
    }
    toString() {
        return `r${this.i}c${this.j}`;
    }
    cmp(that) {
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
}
Cell.MAX_VAL = 0xFFFF;
// puzzle grid handles digits and resolving constraints
class PuzzleGrid {
    get rows() {
        return this._rows;
    }
    get columns() {
        return this._columns;
    }
    constructor(sceneManager, rows, columns) {
        // key: cell row and column
        // value: set of constraints affecting the cell
        this.constraintMap = new Map();
        this.violatedConstraints = new Set();
        this.digitMap = new Map();
        throwIfFalse(Number.isInteger(rows));
        throwIfFalse(Number.isInteger(columns));
        this._rows = rows;
        this._columns = columns;
        this.sceneManager = sceneManager;
        this.errorHighlight = sceneManager.createElement("g", SVGGElement, RenderLayer.Fill);
        this.errorHighlight.setAttribute("opacity", "1.0");
    }
    // returns the previous digit at that cell if present
    setDigitAtCell(cell, digit) {
        const key = cell.toString();
        let pair = this.digitMap.get(key);
        let retval = null;
        if (pair) {
            let [previousDigit, text] = pair;
            retval = previousDigit;
            // new digit to write
            if (digit) {
                previousDigit = digit;
                text.innerHTML = `${digit}`;
                // otherwise delete entry
            }
            else {
                this.sceneManager.removeElement(text);
                this.digitMap.delete(key);
            }
        }
        else {
            // new digit to write
            if (digit) {
                let text = this.sceneManager.createElement("text", SVGTextElement, RenderLayer.PencilMark);
                text.setAttributes(["text-anchor", "middle"], ["dominant-baseline", "central"], ["x", `${cell.j * CELL_SIZE + CELL_SIZE / 2}`], ["y", `${cell.i * CELL_SIZE + CELL_SIZE / 2}`], ["font-size", `${CELL_SIZE * 3 / 4}`], ["font-family", "sans-serif"]);
                text.innerHTML = `${digit}`;
                this.digitMap.set(key, [digit, text]);
            }
        }
        // get the set of constraints on a cell and verify it is not violated
        let constraintsOnCell = this.constraintMap.get(key);
        if (constraintsOnCell) {
            for (let constraint of constraintsOnCell) {
                if (constraint.isConstraintViolated(this)) {
                    this.violatedConstraints.add(constraint);
                }
                else {
                    this.violatedConstraints.delete(constraint);
                }
            }
            let affectedCells = new BSTSet();
            for (let constraint of this.violatedConstraints) {
                for (let cell of constraint.cells) {
                    affectedCells.add(cell);
                }
            }
            this.errorHighlight.clearChildren();
            if (affectedCells.size > 0) {
                console.debug(`Constraint violation! ${affectedCells.size} cells affected:`);
            }
            for (let cell of affectedCells) {
                // may be smarter to do this on a per constraint level then by cell
                console.debug(` ${cell}`);
                let rect = this.sceneManager.createElement("rect", SVGRectElement);
                rect.setAttributes(["x", `${cell.j * CELL_SIZE}`], ["y", `${cell.i * CELL_SIZE}`], ["width", `${CELL_SIZE}`], ["height", `${CELL_SIZE}`], ["fill", Colour.Pink.toString()]);
                this.errorHighlight.appendChild(rect);
            }
        }
        return retval;
    }
    getDigitAtCell(cell) {
        const key = cell.toString();
        let retval = this.digitMap.get(key);
        if (retval !== undefined) {
            let [digit, _svg] = retval;
            return digit;
        }
        return null;
    }
    addConstraintToCell(cell, constraint) {
        const key = cell.toString();
        if (!this.constraintMap.has(key)) {
            this.constraintMap.set(key, new Set());
        }
        let set = this.constraintMap.get(key);
        throwIfNull(set);
        set.add(constraint);
    }
    removeConstraintFromCell(cell, constraint) {
        const key = cell.toString();
        let set = this.constraintMap.get(key);
        throwIfNull(set);
        set.delete(constraint);
        if (set.size === 0) {
            this.constraintMap.delete(key);
        }
    }
}
