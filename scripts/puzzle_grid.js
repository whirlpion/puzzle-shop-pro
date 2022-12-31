"use strict";
// a puzzle object is the 'owner' of the visual and logical aspects of a puzzle piece
class IConstraint {
    get cells() {
        return this._cells;
    }
    get svg() {
        throwIfNull(this._svg);
        return this._svg;
    }
    //  takes in a list of cells affected by this constraint and an svg element for display
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
        this.constraintMap = new BSTMap();
        this.violatedConstraints = new Set();
        this.digitMap = new BSTMap();
        throwIfFalse(Number.isInteger(rows));
        throwIfFalse(Number.isInteger(columns));
        this._rows = rows;
        this._columns = columns;
        this.sceneManager = sceneManager;
        this.errorHighlight = sceneManager.createElement("g", SVGGElement, RenderLayer.Fill);
    }
    checkCellsForConstraintViolations(...cells) {
        // checks each of the requested cells
        for (let cell of cells) {
            // identify all the constraints affecting the current cell
            let constraintsOnCell = this.constraintMap.get(cell);
            if (constraintsOnCell) {
                // determine if the constraint is violated
                for (let constraint of constraintsOnCell) {
                    if (constraint.isConstraintViolated(this)) {
                        this.violatedConstraints.add(constraint);
                    }
                    else {
                        this.violatedConstraints.delete(constraint);
                    }
                }
            }
        }
        // now construct set of all cells within the violated constraints area
        let affectedCells = new BSTSet();
        for (let constraint of this.violatedConstraints) {
            for (let cell of constraint.cells) {
                affectedCells.add(cell);
            }
        }
        // TODO: there's probably a smarter way to batch together cells into larger
        // svg elements rather than painting a rect over each individual cell; keep
        // in mind if we see performance issues here
        this.errorHighlight.clearChildren();
        if (affectedCells.size > 0) {
            console.debug(`Constraint violation! ${affectedCells.size} cells affected`);
            for (let cell of affectedCells) {
                let rect = this.sceneManager.createElement("rect", SVGRectElement);
                rect.setAttributes(["x", `${cell.j * CELL_SIZE}`], ["y", `${cell.i * CELL_SIZE}`], ["width", `${CELL_SIZE}`], ["height", `${CELL_SIZE}`], ["fill", Colour.Pink.toString()]);
                this.errorHighlight.appendChild(rect);
            }
        }
    }
    // returns the previous digit at that cell if present
    setDigitAtCell(cell, digit) {
        let pair = this.digitMap.get(cell);
        let retval = null;
        if (pair) {
            // pair[0] : Digit
            // pair[1] : SVGTextElement
            retval = pair[0];
            // new digit to write
            if (digit) {
                pair[0] = digit;
                pair[1].innerHTML = `${digit}`;
                // otherwise delete entry
            }
            else {
                this.sceneManager.removeElement(pair[1]);
                this.digitMap.delete(cell);
            }
        }
        else {
            // new digit to write
            if (digit) {
                let text = this.sceneManager.createElement("text", SVGTextElement, RenderLayer.PencilMark);
                text.setAttributes(["text-anchor", "middle"], ["dominant-baseline", "central"], ["x", `${cell.j * CELL_SIZE + CELL_SIZE / 2}`], ["y", `${cell.i * CELL_SIZE + CELL_SIZE / 2}`], ["font-size", `${CELL_SIZE * 3 / 4}`], ["font-family", "sans-serif"]);
                text.innerHTML = `${digit}`;
                this.digitMap.set(cell, [digit, text]);
            }
        }
        this.checkCellsForConstraintViolations(cell);
        return retval;
    }
    getCellsWithDigit(query) {
        let retval = new Array();
        for (let [cell, [digit, _element]] of this.digitMap) {
            console.log(`cell: ${cell}, digit: ${digit}`);
            if (query === digit) {
                retval.push(cell);
            }
        }
        return retval;
    }
    getDigitAtCell(cell) {
        let retval = this.digitMap.get(cell);
        if (retval !== undefined) {
            let [digit, _svg] = retval;
            return digit;
        }
        return null;
    }
    // adds a constraint and optionally checks to see if its addition affects
    // the set of cells under violated constraints
    addConstraint(constraint, checkViolations) {
        for (let cell of constraint.cells) {
            // get set of constraints already on cell, or create new one
            let constraints = this.constraintMap.get(cell);
            if (!constraints) {
                constraints = new Set();
                this.constraintMap.set(cell, constraints);
            }
            // update the set with our constraint
            constraints.add(constraint);
        }
        if (checkViolations) {
            this.checkCellsForConstraintViolations(...constraint.cells);
        }
    }
    // removes a constraint and optionally checks to see if its removal affects
    // the set of cells under violated constraints
    removeConstraint(constraint, checkViolations) {
        for (let cell of constraint.cells) {
            // get the set of contraints already on cell
            let constraints = this.constraintMap.get(cell);
            throwIfUndefined(constraints);
            constraints.delete(constraint);
            // if no constraints exist on the cell, remove the entry from the map
            if (constraints.size === 0) {
                this.constraintMap.delete(cell);
            }
            // constraint is no longer in play so it can't be violated
            this.violatedConstraints.delete(constraint);
        }
        if (checkViolations) {
            this.checkCellsForConstraintViolations(...constraint.cells);
        }
    }
}
