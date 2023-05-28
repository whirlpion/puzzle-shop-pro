"use strict";
// a puzzle object is the 'owner' of the visual and logical aspects of a puzzle piece
class IConstraint {
    get cells() {
        return this._cells;
    }
    get boundingBox() {
        return this._boundingBox;
    }
    get svg() {
        throwIfNull(this._svg);
        return this._svg;
    }
    //  takes in a list of cells affected by this constraint and an svg element for display
    constructor(cells, boundingBox, svg, name) {
        this._cells = cells;
        this._svg = svg;
        this._boundingBox = boundingBox;
        this.name = name;
    }
    translate(rows, columns) {
        let cells = new Array();
        for (let cell of this._cells) {
            cells.push(new Cell(cell.i + rows, cell.j + columns));
        }
        this._cells = cells;
        this._boundingBox = BoundingBox.fromCells(...this._cells);
        if (this._svg) {
            const x = this._boundingBox.left * CELL_SIZE;
            const y = this._boundingBox.top * CELL_SIZE;
            this._svg.setAttribute("transform", `translate(${x},${y})`);
        }
    }
}
var HighlightCellsFlags;
(function (HighlightCellsFlags) {
    HighlightCellsFlags[HighlightCellsFlags["None"] = 0] = "None";
    HighlightCellsFlags[HighlightCellsFlags["Focus"] = 1] = "Focus";
    HighlightCellsFlags[HighlightCellsFlags["Clear"] = 2] = "Clear";
})(HighlightCellsFlags || (HighlightCellsFlags = {}));
var PuzzleEventType;
(function (PuzzleEventType) {
    PuzzleEventType["HighlightedCellsChanged"] = "highlightedcellschanged";
    PuzzleEventType["CellValuesChanged"] = "cellvalueschanged";
    PuzzleEventType["ViolatedConstraintsChanged"] = "violatedconstraintschanged";
    PuzzleEventType["ConstraintsAdded"] = "constraintsadded";
    PuzzleEventType["ConstraintsRemoved"] = "constraintsremoved";
    PuzzleEventType["ConstraintsSelected"] = "constraintsselected";
    PuzzleEventType["ConstraintsDeselected"] = "constraintsdeselected";
})(PuzzleEventType || (PuzzleEventType = {}));
;
class PuzzleEvent {
    constructor(grid) {
        this.grid = grid;
    }
}
class ConstraintEvent extends PuzzleEvent {
    constructor(grid, constraints) {
        super(grid);
        this.constraints = constraints;
    }
}
class CellEvent extends PuzzleEvent {
    constructor(grid, cells) {
        super(grid);
        this.cells = cells;
    }
}
// puzzle grid handles digits and resolving constraints
class PuzzleGrid {
    // are any constraints selected
    get hasSelectedConstraints() {
        return this.selectedConstraints.size > 0;
    }
    get selectionBoundingBox() {
        return this._selectionBoundingBox;
    }
    // are any cells highlighted
    get hasHighlightedCells() {
        return this.highlightedCells.size > 0;
    }
    get focusedCell() {
        return this._focusedCell;
    }
    constructor(sceneManager) {
        // key: cell row and column
        // value: set of constraints affecting the cell
        this.constraintMap = new BSTMap();
        this.violatedConstraints = new Set();
        // the set of constraints currently selectd
        this.selectedConstraints = new Set();
        // bounding box representation of the selections
        this._selectionBoundingBox = BoundingBox.Empty;
        // digits in cells
        this.cellMap = new BSTMap();
        // the cells which are currently highlighted mapped to their associated SVG Rect
        this.highlightedCells = new BSTMap();
        // the cell that has focus currently
        this._focusedCell = null;
        // Event Functions
        this.listenerRegistry = new Map();
        this.sceneManager = sceneManager;
        // this.constraintListPanel = constraintListPanel;
        this.errorHighlight = sceneManager.createElement("g", SVGGElement, RenderLayer.Fill);
        this.highlightSvg = sceneManager.createElement("g", SVGGElement, RenderLayer.Fill);
        this.selectionBox = sceneManager.createElement("rect", SVGRectElement, RenderLayer.Foreground);
        this.selectionBox.setAttributes(["fill", "none"], ["stroke", "black"], ["stroke-dasharray", "5,6,10,6,5,0"], ["stroke-width", "2"], ["visibility", "hidden"]);
    }
    addEventListener(eventType, listener) {
        let listeners = this.listenerRegistry.get(eventType);
        if (!listeners) {
            listeners = new Set();
            this.listenerRegistry.set(eventType, listeners);
        }
        listeners.add(listener);
    }
    removeEventListener(eventType, listener) {
        const listeners = this.listenerRegistry.get(eventType);
        if (listeners) {
            listeners.delete(listener);
        }
    }
    fireEvent(eventType, event) {
        globalThis.setTimeout(() => {
            const listeners = this.listenerRegistry.get(eventType);
            if (listeners) {
                for (let listener of listeners) {
                    listener(event);
                }
            }
        });
    }
    // Highlight Functions
    clearAllHighlights() {
        this.highlightedCells.clear();
        this.highlightSvg.clearChildren();
        this._focusedCell = null;
        this.fireEvent(PuzzleEventType.HighlightedCellsChanged, new CellEvent(this, []));
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
        this.fireEvent(PuzzleEventType.HighlightedCellsChanged, new CellEvent(this, [...this.highlightedCells.keys()]));
    }
    // toglges cell highlight state
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
        this.fireEvent(PuzzleEventType.HighlightedCellsChanged, new CellEvent(this, [...this.highlightedCells.keys()]));
    }
    getHighlightedCells() {
        return [...this.highlightedCells.keys()];
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
            this.fireEvent(PuzzleEventType.HighlightedCellsChanged, new CellEvent(this, [...this.highlightedCells.keys()]));
        }
    }
    // Constraint Functions
    getConstraintsAtCell(cell) {
        let constraints = this.constraintMap.get(cell);
        if (constraints) {
            return [...constraints.values()];
        }
        else {
            return [];
        }
    }
    isConstraintSelected(constraint) {
        return this.selectedConstraints.has(constraint);
    }
    selectConstraint(constraint) {
        this.selectedConstraints.add(constraint);
        this.fireEvent(PuzzleEventType.ConstraintsSelected, new ConstraintEvent(this, [constraint]));
    }
    unselectConstraint(constraint) {
        this.selectedConstraints.delete(constraint);
        this.fireEvent(PuzzleEventType.ConstraintsDeselected, new ConstraintEvent(this, [constraint]));
    }
    clearSelectedConstraints() {
        let selectedConstraints = [...this.selectedConstraints];
        this.selectedConstraints.clear();
        for (let constraint of selectedConstraints) {
            this.unselectConstraint(constraint);
        }
    }
    getSelectedConstraints() {
        return [...this.selectedConstraints.values()];
    }
    updateSelectionBox() {
        // update our visual selection box
        if (this.selectedConstraints.size > 0) {
            // construct list of bounding boxes
            let boundingBoxes = new Array();
            for (let constraint of this.selectedConstraints) {
                boundingBoxes.push(constraint.boundingBox);
            }
            // join them all together
            const boundingBox = BoundingBox.union(...boundingBoxes);
            this._selectionBoundingBox = boundingBox;
            const MARGIN = CELL_SIZE / 8;
            let x = boundingBox.j * CELL_SIZE - MARGIN;
            let y = boundingBox.i * CELL_SIZE - MARGIN;
            let width = boundingBox.columns * CELL_SIZE + 2 * MARGIN;
            let height = boundingBox.rows * CELL_SIZE + 2 * MARGIN;
            ;
            this.selectionBox.setAttributes(["x", `${x}`], ["y", `${y}`], ["width", `${width}`], ["height", `${height}`], ["visibility", "visible"]);
        }
        else {
            this._selectionBoundingBox = BoundingBox.Empty;
            this.selectionBox.setAttributes(["visibility", "hidden"]);
        }
    }
    checkCellsForConstraintViolations(...cells) {
        // construct our set of constraints affecting the given cells
        let constraints = new Set();
        // start with our set of already violated constraints
        constraints = Set.union(constraints, this.violatedConstraints);
        for (let cell of cells) {
            const currentConstraints = this.constraintMap.get(cell);
            if (currentConstraints) {
                constraints = Set.union(constraints, currentConstraints);
            }
        }
        // now identify which constraints are violated and which cells
        // in the constraints are violated
        let affectedCells = new BSTSet();
        // start with our
        for (let constraint of constraints) {
            let cells = constraint.getViolatedCells(this);
            if (cells.size > 0) {
                affectedCells = BSTSet.union(affectedCells, cells);
                this.violatedConstraints.add(constraint);
            }
            else {
                this.violatedConstraints.delete(constraint);
            }
        }
        // todo: avoid false positives
        this.fireEvent(PuzzleEventType.ViolatedConstraintsChanged, new ConstraintEvent(this, [...this.violatedConstraints]));
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
        // update the constraint list panel
        // this.constraintListPanel.addConstraint(constraint);
        this.fireEvent(PuzzleEventType.ConstraintsAdded, new ConstraintEvent(this, [constraint]));
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
        this.selectedConstraints.delete(constraint);
        this.fireEvent(PuzzleEventType.ConstraintsRemoved, new ConstraintEvent(this, [constraint]));
        if (checkViolations) {
            this.checkCellsForConstraintViolations(...constraint.cells);
        }
    }
    translateConstraints(rows, columns, constraints) {
        if (rows != 0 || columns != 0) {
            throwIfFalse(Number.isInteger(rows));
            throwIfFalse(Number.isInteger(columns));
            // translate all constraints, and note old locations
            // remove all our violated constraints since we're going to re-check
            const oldCells = new BSTSet();
            for (let constraint of constraints) {
                oldCells.add(...constraint.cells);
                constraint.translate(rows, columns);
                this.violatedConstraints.delete(constraint);
            }
            // remove constraints from constraint map
            for (let cell of oldCells) {
                let constraintsAtCell = this.constraintMap.get(cell);
                throwIfUndefined(constraintsAtCell);
                for (let constraint of constraints) {
                    constraintsAtCell.delete(constraint);
                }
            }
            // add constraints to back to constraint map and note
            // new locations
            const newCells = new BSTSet();
            for (let constraint of constraints) {
                for (let cell of constraint.cells) {
                    newCells.add(cell);
                    let constraintsAtCell = this.constraintMap.get(cell);
                    if (constraintsAtCell === undefined) {
                        constraintsAtCell = new Set();
                        this.constraintMap.set(cell, constraintsAtCell);
                    }
                    constraintsAtCell.add(constraint);
                }
            }
            let cells = BSTSet.union(newCells, oldCells);
            this.checkCellsForConstraintViolations(...cells);
        }
    }
    translateSelectedConstraints(rows, columns) {
        if (rows != 0 || columns != 0) {
            this.translateConstraints(rows, columns, [...this.selectedConstraints]);
            this.updateSelectionBox();
        }
    }
    // Cell Setters/Getters
    setCellValue(cell, value, checkViolations) {
        let pair = this.cellMap.get(cell);
        if (pair) {
            if (pair[0].equals(value)) {
                // cell value is the same nothing to do
                return;
            }
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
        this.fireEvent(PuzzleEventType.CellValuesChanged, new CellEvent(this, [cell]));
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
            this.fireEvent(PuzzleEventType.CellValuesChanged, new CellEvent(this, [cell]));
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
