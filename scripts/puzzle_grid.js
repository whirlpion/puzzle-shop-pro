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
                newFocus = new Cell(this.focusedCell.i - 1, this.focusedCell.j);
                break;
            case Direction.Right:
                newFocus = new Cell(this.focusedCell.i, this.focusedCell.j + 1);
                break;
            case Direction.Down:
                newFocus = new Cell(this.focusedCell.i + 1, this.focusedCell.j);
                break;
            case Direction.Left:
                newFocus = new Cell(this.focusedCell.i, this.focusedCell.j - 1);
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
    // Cell Setters/Getters
    setCellValue(cell, value, checkViolations) {
        let pair = this.cellMap.get(cell);
        if (pair) {
            this.cellMap.delete(cell);
            let [_value, svg] = pair;
            this.sceneManager.removeElement(svg);
        }
        const baseFontSize = CELL_SIZE * 4 / 5;
        if (value.digit) {
            // digit
            let text = this.sceneManager.createElement("text", SVGTextElement, RenderLayer.PencilMark);
            text.setAttributes(["text-anchor", "middle"], ["dominant-baseline", "central"], ["x", `${cell.j * CELL_SIZE + CELL_SIZE / 2}`], ["y", `${cell.i * CELL_SIZE + CELL_SIZE / 2}`], ["font-size", `${baseFontSize}`], ["font-family", "sans-serif"]);
            text.innerHTML = `${value.digit}`;
            this.cellMap.set(cell, [value, text]);
        }
        else if (value.centerMark || value.cornerMark) {
            // pencil marks
            let pencilMarks = this.sceneManager.createElement("g", SVGGElement, RenderLayer.PencilMark);
            if (value.centerMark) {
                let digitFlagStr = DigitFlag.toString(value.centerMark);
                let text = this.sceneManager.createElement("text", SVGTextElement);
                const fontSize = baseFontSize * 1.5 / Math.max(4, digitFlagStr.length);
                text.setAttributes(["text-anchor", "middle"], ["dominant-baseline", "central"], ["x", `${cell.j * CELL_SIZE + CELL_SIZE / 2}`], ["y", `${cell.i * CELL_SIZE + CELL_SIZE / 2}`], ["font-size", `${fontSize}`], ["font-family", "sans-serif"]);
                text.textContent = digitFlagStr;
                pencilMarks.appendChild(text);
            }
            if (value.cornerMark) {
                let digits = DigitFlag.toDigits(value.cornerMark);
                const count = digits.length;
                throwIfFalse(count > 0 && count <= 9);
                let coords = new Array();
                const fontSize = baseFontSize / 4;
                switch (count) {
                    case 1:
                        coords.push([0.15, 0.2]);
                        break;
                    case 2:
                        coords.push([0.15, 0.2]);
                        coords.push([0.85, 0.2]);
                        break;
                    case 3:
                        coords.push([0.15, 0.2]);
                        coords.push([0.85, 0.2]);
                        coords.push([0.15, 0.8]);
                        break;
                    case 4:
                        coords.push([0.15, 0.2]);
                        coords.push([0.85, 0.2]);
                        coords.push([0.15, 0.8]);
                        coords.push([0.85, 0.8]);
                        break;
                    case 5:
                        coords.push([0.15, 0.2]);
                        coords.push([0.5, 0.2]);
                        coords.push([0.85, 0.2]);
                        coords.push([0.15, 0.8]);
                        coords.push([0.85, 0.8]);
                        break;
                    case 6:
                        coords.push([0.15, 0.2]);
                        coords.push([0.5, 0.2]);
                        coords.push([0.85, 0.2]);
                        coords.push([0.15, 0.8]);
                        coords.push([0.5, 0.8]);
                        coords.push([0.85, 0.8]);
                        break;
                    case 7:
                        coords.push([0.15, 0.2]);
                        coords.push([0.3833, 0.2]);
                        coords.push([0.6167, 0.2]);
                        coords.push([0.85, 0.2]);
                        coords.push([0.15, 0.8]);
                        coords.push([0.5, 0.8]);
                        coords.push([0.85, 0.8]);
                        break;
                    case 8:
                        coords.push([0.15, 0.2]);
                        coords.push([0.3833, 0.2]);
                        coords.push([0.6167, 0.2]);
                        coords.push([0.85, 0.2]);
                        coords.push([0.15, 0.8]);
                        coords.push([0.3833, 0.8]);
                        coords.push([0.6167, 0.8]);
                        coords.push([0.85, 0.8]);
                        break;
                    case 9:
                        coords.push([0.15, 0.2]);
                        coords.push([0.325, 0.2]);
                        coords.push([0.5, 0.2]);
                        coords.push([0.675, 0.2]);
                        coords.push([0.85, 0.2]);
                        coords.push([0.15, 0.8]);
                        coords.push([0.3833, 0.8]);
                        coords.push([0.6167, 0.8]);
                        coords.push([0.85, 0.8]);
                        break;
                }
                for (let k = 0; k < count; k++) {
                    const [x, y] = coords[k];
                    const digit = digits[k];
                    let text = this.sceneManager.createElement("text", SVGTextElement);
                    text.setAttributes(["text-anchor", "middle"], ["dominant-baseline", "central"], ["x", `${cell.j * CELL_SIZE + CELL_SIZE * x}`], ["y", `${cell.i * CELL_SIZE + CELL_SIZE * y}`], ["font-size", `${fontSize}`], ["font-family", "sans-serif"]);
                    text.textContent = `${digit}`;
                    pencilMarks.appendChild(text);
                }
            }
            this.cellMap.set(cell, [value, pencilMarks]);
        }
        if (checkViolations) {
            this.checkCellsForConstraintViolations(cell);
        }
    }
    deleteCellValue(cell, checkViolations) {
        let pair = this.cellMap.get(cell);
        if (pair) {
            let [_value, svg] = pair;
            this.sceneManager.removeElement(svg);
            this.cellMap.delete(cell);
        }
        if (checkViolations) {
            this.checkCellsForConstraintViolations(cell);
        }
    }
    getCellsWithCondition(filter) {
        let retval = new Array();
        for (let [cell, [value, _element]] of this.cellMap) {
            if (filter(value)) {
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
    getCellValue(cell) {
        const value = this.cellMap.get(cell);
        return value ? value[0] : null;
    }
}
