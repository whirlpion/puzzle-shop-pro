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
var HighlightCellsFlags;
(function (HighlightCellsFlags) {
    HighlightCellsFlags[HighlightCellsFlags["None"] = 0] = "None";
    HighlightCellsFlags[HighlightCellsFlags["Focus"] = 1] = "Focus";
    HighlightCellsFlags[HighlightCellsFlags["Clear"] = 2] = "Clear";
})(HighlightCellsFlags || (HighlightCellsFlags = {}));
// puzzle grid handles digits and resolving constraints
class PuzzleGrid {
    get rows() {
        return this._rows;
    }
    get columns() {
        return this._columns;
    }
    // are any cells highlighted
    get hasHighlightedCells() {
        return this.highlightedCells.size > 0;
    }
    get focusedCell() {
        return this._focusedCell;
    }
    constructor(sceneManager, rows, columns) {
        // key: cell row and column
        // value: set of constraints affecting the cell
        this.constraintMap = new BSTMap();
        this.violatedConstraints = new Set();
        this.cellMap = new BSTMap();
        // the cells which are currently highlighted mapped to their associated SVG Rect
        this.highlightedCells = new BSTMap();
        // the cell that has focus
        this._focusedCell = null;
        throwIfFalse(Number.isInteger(rows));
        throwIfFalse(Number.isInteger(columns));
        this._rows = rows;
        this._columns = columns;
        this.sceneManager = sceneManager;
        this.errorHighlight = sceneManager.createElement("g", SVGGElement, RenderLayer.Fill);
        this.highlightSvg = sceneManager.createElement("g", SVGGElement, RenderLayer.Fill);
    }
    // Highlight Functions
    clearAllHighlights() {
        this.highlightedCells.clear();
        this.highlightSvg.clearChildren();
        this._focusedCell = null;
    }
    focusCell(cell) {
        this._focusedCell = cell;
    }
    highlightCells(flags, ...cells) {
        // only keep cells in the provided cells array
        // we keep any existing svgs rather then deleting/remaking
        if (flags & HighlightCellsFlags.Clear) {
            this.highlightSvg.clearChildren();
            let highlightedCells = new BSTMap();
            for (let cell of cells) {
                let rect = this.highlightedCells.get(cell);
                if (rect) {
                    highlightedCells.set(cell, rect);
                    this.highlightSvg.appendChild(rect);
                }
            }
            this.highlightedCells = highlightedCells;
        }
        for (let cell of cells) {
            if (this.highlightedCells.has(cell)) {
                continue;
            }
            const rect = this.sceneManager.createElement("rect", SVGRectElement);
            rect.setAttributes(["width", `${CELL_SIZE}`], ["height", `${CELL_SIZE}`], ["fill", Colour.LightBlue.toString()], ["x", `${cell.j * CELL_SIZE}`], ["y", `${cell.i * CELL_SIZE}`]);
            this.highlightedCells.set(cell, rect);
            this.highlightSvg.appendChild(rect);
        }
        if (flags & HighlightCellsFlags.Focus) {
            this._focusedCell = cells.last();
        }
    }
    toggleCell(cell) {
        // cell toggle
        let rect = this.highlightedCells.get(cell);
        if (rect) {
            this.highlightedCells.delete(cell);
            this.highlightSvg.removeChild(rect);
            // no focused cell after this point
            this._focusedCell = null;
        }
        else {
            this.highlightCells(HighlightCellsFlags.Focus, cell);
        }
    }
    getHighlightedCells() {
        return Array.collect(this.highlightedCells.keys());
    }
    moveFocus(direction, clearHighlight) {
        throwIfNull(this.focusedCell);
        let newFocus = null;
        switch (direction) {
            case Direction.Up:
                if (this.focusedCell.i - 1 >= 0) {
                    newFocus = new Cell(this.focusedCell.i - 1, this.focusedCell.j);
                }
                break;
            case Direction.Right:
                if (this.focusedCell.j + 1 < this.columns) {
                    newFocus = new Cell(this.focusedCell.i, this.focusedCell.j + 1);
                }
                break;
            case Direction.Down:
                if (this.focusedCell.i + 1 < this.rows) {
                    newFocus = new Cell(this.focusedCell.i + 1, this.focusedCell.j);
                }
                break;
            case Direction.Left:
                if (this.focusedCell.j - 1 >= 0) {
                    newFocus = new Cell(this.focusedCell.i, this.focusedCell.j - 1);
                }
                break;
            default:
                throwMessage(`Unexpected Direction: ${direction}`);
                break;
        }
        if (newFocus) {
            if (clearHighlight) {
                this.clearAllHighlights();
            }
            this.highlightCells(HighlightCellsFlags.Focus, newFocus);
        }
    }
    // Constraint Functions
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
    // Cell Settres/Getters
    // returns the previous digit at that cell if present
    setCellValue(cell, value) {
        let pair = this.cellMap.get(cell);
        let prevValue = null;
        if (pair) {
            // pair[0] : PencilMark
            // pair[1] : SVGTextElement
            prevValue = pair[0];
            // new digit to write
            if (value) {
                pair[0] = value;
                if (value.digit) {
                    pair[1].textContent = `${value.digit}`;
                }
                else {
                    pair[1].textContent = '';
                }
                // otherwise delete entry
            }
            else {
                this.sceneManager.removeElement(pair[1]);
                this.cellMap.delete(cell);
            }
        }
        else {
            // new digit to write
            if (value) {
                let text = this.sceneManager.createElement("text", SVGTextElement, RenderLayer.PencilMark);
                text.setAttributes(["text-anchor", "middle"], ["dominant-baseline", "central"], ["x", `${cell.j * CELL_SIZE + CELL_SIZE / 2}`], ["y", `${cell.i * CELL_SIZE + CELL_SIZE / 2}`], ["font-size", `${CELL_SIZE * 3 / 4}`], ["font-family", "sans-serif"]);
                text.innerHTML = `${value.digit}`;
                if (value.digit) {
                    text.textContent = `${value.digit}`;
                }
                else {
                    text.textContent = '';
                }
                this.cellMap.set(cell, [value, text]);
            }
        }
        this.checkCellsForConstraintViolations(cell);
        return prevValue;
    }
    getCellsWithDigit(digit) {
        let retval = new Array();
        for (let [cell, [value, _element]] of this.cellMap) {
            if (digit === value.digit) {
                retval.push(cell);
            }
        }
        return retval;
    }
    getDigitAtCell(cell) {
        let retval = this.cellMap.get(cell);
        if (retval !== undefined) {
            let [value, _svg] = retval;
            return value.digit;
        }
        return null;
    }
}
