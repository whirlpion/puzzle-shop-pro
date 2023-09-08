"use strict";
// a puzzle object is the 'owner' of the visual and logical aspects of a puzzle piece
class IConstraint {
    get cells() {
        return this._cells;
    }
    get uniqueCells() {
        return new BSTSet(this._cells);
    }
    get boundingBox() {
        return this._boundingBox;
    }
    get graphic() {
        return this._graphic;
    }
    //  takes in a list of cells affected by this constraint and an svg element for display
    constructor(cells, boundingBox, graphic, name) {
        this._cells = cells;
        this._graphic = graphic;
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
        for (let svg of this.graphic.svgs) {
            const x = this._boundingBox.left * CELL_SIZE;
            const y = this._boundingBox.top * CELL_SIZE;
            svg.setAttribute("transform", `translate(${x},${y})`);
        }
    }
}
class InsertConstraintAction extends IAction {
    apply() {
        // register the constrained cells
        this.puzzleGrid.addConstraint(this.constraint);
        // check for constraint violations
        this.puzzleGrid.checkCellsForConstraintViolations(...this.constraint.cells);
        // add the svgs
        this.sceneManager.addGraphic(this.constraint.graphic);
        // update the selection box
        this.puzzleGrid.updateSelectionBox();
    }
    revert() {
        // remove the constrained cells
        this.puzzleGrid.removeConstraint(this.constraint);
        // check for constraint violations
        this.puzzleGrid.checkCellsForConstraintViolations(...this.constraint.cells);
        // remove the svg
        this.sceneManager.removeGraphic(this.constraint.graphic);
        // update the selection box
        this.puzzleGrid.updateSelectionBox();
    }
    constructor(puzzleGrid, sceneManager, constraint, renderLayer = RenderLayer.Constraints) {
        super(`insert ${constraint.name} at r${constraint.boundingBox.top}c${constraint.boundingBox.right}`);
        this.puzzleGrid = puzzleGrid;
        this.sceneManager = sceneManager;
        this.constraint = constraint;
        this.renderLayer = renderLayer;
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
        // the cells which are currently highlighted mapped to their associated SVG Path
        this.highlightedCells = new BSTMap();
        // the cell that has focus currently
        this._focusedCell = null;
        // Event Functions
        this.listenerRegistry = new Map();
        this.sceneManager = sceneManager;
        this.errorHighlight = sceneManager.createElement("g", SVGGElement, RenderLayer.CellHighlight);
        this.errorHighlight.setAttributes(["fill", Colour.LightRed.adjustAlpha(0.5).toString()]);
        this.highlightTileset = new SVGTileSet(this.sceneManager, 6);
        this.highlightSvg = sceneManager.createElement("g", SVGGElement, RenderLayer.CellHighlight);
        this.highlightSvg.setAttributes(["fill", "none"], ["stroke", Colour.LightBlue.toString()], ["stroke-width", "12px"], ["stroke-linejoin", "round"]);
        this.selectionBox = sceneManager.createElement("rect", SVGRectElement, RenderLayer.Foreground);
        // number of dashes pe rcell
        const DASHES_PER_CELL = 4;
        // size of dash relative to blank
        const DASH_RATIO = 1.5;
        // CELL_SIZE = DASHES_PER_CELL * (DASH_SIZE + DASH_SIZE / DASH_RATIO);
        // CELL_SIZE = DASHES_PER_CELL * DASH_SIZE * (1 + 1 / DASH_RATIO);
        const DASH_SIZE = CELL_SIZE / DASHES_PER_CELL / (1 + 1 / DASH_RATIO);
        const BLANK_SIZE = DASH_SIZE / DASH_RATIO;
        this.selectionBox.setAttributes(["fill", "none"], ["stroke", "black"], ["stroke-dasharray", `${DASH_SIZE / 2},${BLANK_SIZE},${DASH_SIZE},${BLANK_SIZE},${DASH_SIZE / 2},0`], ["stroke-width", "2"], ["visibility", "hidden"]);
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
        // the set of already highlightd cells that would be affected by these new cells
        let dirtyCells = new BSTSet();
        if (flags & HighlightCellsFlags.Clear) {
            // clear out existing paths and highlighted cells
            this.highlightSvg.clearChildren();
            this.highlightedCells.clear();
            // set new cells as highlightd
            for (let cell of cells) {
                this.highlightedCells.set(cell, null);
                dirtyCells.add(cell);
            }
        }
        else {
            // add any existing cells touched by new to dirt set
            for (let cell of cells) {
                if (this.highlightedCells.has(cell.northNeighbor))
                    dirtyCells.add(cell.northNeighbor);
                if (this.highlightedCells.has(cell.northEastNeighbor))
                    dirtyCells.add(cell.northEastNeighbor);
                if (this.highlightedCells.has(cell.eastNeighbor))
                    dirtyCells.add(cell.eastNeighbor);
                if (this.highlightedCells.has(cell.southEastNeighbor))
                    dirtyCells.add(cell.southEastNeighbor);
                if (this.highlightedCells.has(cell.southNeighbor))
                    dirtyCells.add(cell.southNeighbor);
                if (this.highlightedCells.has(cell.southWestNeighbor))
                    dirtyCells.add(cell.southWestNeighbor);
                if (this.highlightedCells.has(cell.westNeighbor))
                    dirtyCells.add(cell.westNeighbor);
                if (this.highlightedCells.has(cell.northWestNeighbor))
                    dirtyCells.add(cell.northWestNeighbor);
            }
            // append new cells to highlighted
            for (let cell of cells) {
                if (!this.highlightedCells.has(cell)) {
                    this.highlightedCells.set(cell, null);
                }
                dirtyCells.add(cell);
            }
        }
        // for each cell generate path svg to render
        for (let cell of dirtyCells) {
            let oldPath = this.highlightedCells.get(cell);
            if (oldPath) {
                this.highlightSvg.removeChild(oldPath);
            }
            let neighbors = DirectionFlag.None;
            if (this.highlightedCells.has(cell.northNeighbor))
                neighbors |= DirectionFlag.North;
            if (this.highlightedCells.has(cell.northEastNeighbor))
                neighbors |= DirectionFlag.NorthEast;
            if (this.highlightedCells.has(cell.eastNeighbor))
                neighbors |= DirectionFlag.East;
            if (this.highlightedCells.has(cell.southEastNeighbor))
                neighbors |= DirectionFlag.SouthEast;
            if (this.highlightedCells.has(cell.southNeighbor))
                neighbors |= DirectionFlag.South;
            if (this.highlightedCells.has(cell.southWestNeighbor))
                neighbors |= DirectionFlag.SouthWest;
            if (this.highlightedCells.has(cell.westNeighbor))
                neighbors |= DirectionFlag.West;
            if (this.highlightedCells.has(cell.northWestNeighbor))
                neighbors |= DirectionFlag.NorthWest;
            const path = this.highlightTileset.getTile(cell, neighbors);
            this.highlightedCells.set(cell, path);
            this.highlightSvg.appendChild(path);
        }
        if (flags & HighlightCellsFlags.Focus) {
            this._focusedCell = cells.last();
        }
        this.fireEvent(PuzzleEventType.HighlightedCellsChanged, new CellEvent(this, [...this.highlightedCells.keys()]));
    }
    // toglges cell highlight state
    toggleCell(cell) {
        // cell toggle
        let path = this.highlightedCells.get(cell);
        if (path) {
            this.highlightedCells.delete(cell);
            this.highlightSvg.removeChild(path);
            // no focused cell after this point
            this._focusedCell = null;
            // update the paths of neighbors
            for (let dirtyCell of cell.neighbors) {
                if (this.highlightedCells.has(dirtyCell)) {
                    let neighbors = DirectionFlag.None;
                    if (this.highlightedCells.has(dirtyCell.northNeighbor))
                        neighbors |= DirectionFlag.North;
                    if (this.highlightedCells.has(dirtyCell.northEastNeighbor))
                        neighbors |= DirectionFlag.NorthEast;
                    if (this.highlightedCells.has(dirtyCell.eastNeighbor))
                        neighbors |= DirectionFlag.East;
                    if (this.highlightedCells.has(dirtyCell.southEastNeighbor))
                        neighbors |= DirectionFlag.SouthEast;
                    if (this.highlightedCells.has(dirtyCell.southNeighbor))
                        neighbors |= DirectionFlag.South;
                    if (this.highlightedCells.has(dirtyCell.southWestNeighbor))
                        neighbors |= DirectionFlag.SouthWest;
                    if (this.highlightedCells.has(dirtyCell.westNeighbor))
                        neighbors |= DirectionFlag.West;
                    if (this.highlightedCells.has(dirtyCell.northWestNeighbor))
                        neighbors |= DirectionFlag.NorthWest;
                    // get the old path svg nd remove
                    path = this.highlightedCells.get(dirtyCell);
                    if (path) {
                        this.highlightSvg.removeChild(path);
                    }
                    // create new and upate
                    path = this.highlightTileset.getTile(dirtyCell, neighbors);
                    this.highlightedCells.set(dirtyCell, path);
                    this.highlightSvg.appendChild(path);
                }
            }
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
                rect.setAttributes(["x", `${cell.j * CELL_SIZE}`], ["y", `${cell.i * CELL_SIZE}`], ["width", `${CELL_SIZE}`], ["height", `${CELL_SIZE}`]);
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
        for (let cell of constraint.uniqueCells) {
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
            let [_value, graphic] = pair;
            this.sceneManager.removeGraphic(graphic);
        }
        const baseFontSize = CELL_SIZE * 2 / 3;
        let graphic = new Graphic();
        if (value.digit) {
            // digit
            let group = this.sceneManager.createElement("g", SVGGElement);
            group.setAttribute("transform", `translate(${cell.left}, ${cell.top})`);
            let text = this.sceneManager.createElement("text", SVGTextElement);
            text.setAttributes(["text-anchor", "middle"], ["dominant-baseline", "central"], ["x", `${CELL_SIZE / 2}`], ["y", `${CELL_SIZE / 2}`], ["font-size", `${baseFontSize}`], ["font-family", "sans-serif"], ["paint-order", "stroke fill"], ["fill", Colour.Black.toString()], ["stroke", Colour.White.toString()], ["stroke-width", "4"], ["stroke-linejoin", "round"]);
            text.innerHTML = `${value.digit}`;
            group.appendChild(text);
            graphic.set(RenderLayer.PencilMark, group);
        }
        else if (value.centerMark || value.cornerMark) {
            // pencil marks
            let group = this.sceneManager.createElement("g", SVGGElement);
            group.setAttribute("transform", `translate(${cell.left}, ${cell.top})`);
            if (value.centerMark) {
                let digitFlagStr = DigitFlag.toString(value.centerMark);
                let text = this.sceneManager.createElement("text", SVGTextElement);
                const fontSize = baseFontSize * 1.5 / Math.max(4, digitFlagStr.length);
                text.setAttributes(["text-anchor", "middle"], ["dominant-baseline", "central"], ["x", `${CELL_SIZE / 2}`], ["y", `${CELL_SIZE / 2}`], ["font-size", `${fontSize}`], ["font-family", "sans-serif"], ["paint-order", "stroke fill"], ["fill", Colour.Black.toString()], ["stroke", Colour.White.toString()], ["stroke-width", "4"]);
                text.textContent = digitFlagStr;
                group.appendChild(text);
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
                    text.setAttributes(["text-anchor", "middle"], ["dominant-baseline", "central"], ["x", `${CELL_SIZE * x}`], ["y", `${CELL_SIZE * y}`], ["font-size", `${fontSize}`], ["font-family", "sans-serif"], ["paint-order", "stroke fill"], ["fill", Colour.Black.toString()], ["stroke", Colour.White.toString()], ["stroke-width", "4"]);
                    text.textContent = `${digit}`;
                    group.appendChild(text);
                }
            }
            graphic.set(RenderLayer.PencilMark, group);
        }
        if (value.colourMark) {
            const colourTable = [
                Colour.Invisible,
                Colour.HotPink,
                Colour.Red,
                Colour.Orange,
                Colour.Yellow,
                Colour.Green,
                Colour.Turquoise,
                Colour.Indigo,
                Colour.Purple,
                Colour.White,
            ];
            const group = this.sceneManager.createElement("g", SVGGElement);
            group.setAttribute("transform", `translate(${cell.left}, ${cell.top})`);
            const digits = DigitFlag.toDigits(value.colourMark);
            const digitCount = digits.length;
            for (let i = 0; i < digitCount; i++) {
                const digit = digits[i];
                const points = CELL_HIGHLIGHT_POINTS_STRINGS[digitCount][i];
                let polygon = this.sceneManager.createElement("polyline", SVGPolylineElement);
                polygon.setAttributes(["points", points], ["stroke", "none"], ["fill", colourTable[digit].toString()]);
                group.appendChild(polygon);
            }
            graphic.set(RenderLayer.Fill, group);
        }
        this.cellMap.set(cell, [value, graphic]);
        this.sceneManager.addGraphic(graphic);
        this.fireEvent(PuzzleEventType.CellValuesChanged, new CellEvent(this, [cell]));
        if (checkViolations) {
            this.checkCellsForConstraintViolations(cell);
        }
    }
    deleteCellValue(cell, checkViolations) {
        let pair = this.cellMap.get(cell);
        if (pair) {
            let [_value, graphic] = pair;
            this.sceneManager.removeGraphic(graphic);
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
