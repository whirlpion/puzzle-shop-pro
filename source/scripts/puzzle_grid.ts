// a puzzle object is the 'owner' of the visual and logical aspects of a puzzle piece
abstract class IConstraint {
    // list of cells [row,column] affected by this constraint
    private _cells: Array<Cell>;
    // bounding box of cells in this constraint
    private _boundingBox: BoundingBox;
    // handle for an svg element from the CanvasView that
    private _svg: SVGElement | null;
    // human readable name for constraint
    public name: string;

    get cells(): Array<Cell> {
        return this._cells;
    }

    get uniqueCells(): BSTSet<Cell> {
        return new BSTSet(this._cells);
    }

    get boundingBox(): BoundingBox {
        return this._boundingBox;
    }

    get svg(): SVGElement {
        throwIfNull(this._svg);
        return this._svg;
    }

    //  takes in a list of cells affected by this constraint and an svg element for display
    constructor(cells: Array<Cell>, boundingBox: BoundingBox, svg: SVGElement | null, name: string) {
        this._cells = cells;
        this._svg = svg;
        this._boundingBox = boundingBox;
        this.name = name;
    }

    // returns a set of cells which violate the constraint
    abstract getViolatedCells(puzzleGrid: PuzzleGrid): BSTSet<Cell>;

    translate(rows: number, columns: number): void {
        let cells: Array<Cell> = new Array();
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

class InsertConstraintAction extends IAction {
    override apply(): void {
        // register the constrained cells
        this.puzzleGrid.addConstraint(this.constraint);
        // check for constraint violations
        this.puzzleGrid.checkCellsForConstraintViolations(...this.constraint.cells);
        // add the svg
        if (this.constraint.svg) {
            this.sceneManager.addElement(this.constraint.svg, this.renderLayer);
        }
        // update the selection box
        this.puzzleGrid.updateSelectionBox();
    }

    override revert(): void {
        // remove the constrained cells
        this.puzzleGrid.removeConstraint(this.constraint);
        // check for constraint violations
        this.puzzleGrid.checkCellsForConstraintViolations(...this.constraint.cells);
        // remove the svg
        if (this.constraint.svg) {
            this.sceneManager.removeElement(this.constraint.svg);
        }
        // update the selection box
        this.puzzleGrid.updateSelectionBox();
    }

    puzzleGrid: PuzzleGrid;
    sceneManager: SceneManager;
    constraint: IConstraint;
    renderLayer: RenderLayer;


    constructor(puzzleGrid: PuzzleGrid, sceneManager: SceneManager, constraint: IConstraint, renderLayer: RenderLayer=RenderLayer.Constraints) {
        super(`insert ${constraint.name} at r${constraint.boundingBox.top}c${constraint.boundingBox.right}`);

        this.puzzleGrid = puzzleGrid;
        this.sceneManager = sceneManager;
        this.constraint = constraint;
        this.renderLayer = renderLayer;
    }
}

enum HighlightCellsFlags {
    None = 0,
    Focus = 1 << 0,// foucs the last cell in the list
    Clear = 1 << 1, // should all the other cells be removed
}

enum PuzzleEventType {
    HighlightedCellsChanged = "highlightedcellschanged",
    CellValuesChanged = "cellvalueschanged",
    ViolatedConstraintsChanged = "violatedconstraintschanged",
    ConstraintsAdded = "constraintsadded",
    ConstraintsRemoved = "constraintsremoved",
    ConstraintsSelected = "constraintsselected",
    ConstraintsDeselected = "constraintsdeselected",
};

class PuzzleEvent {
    readonly grid: PuzzleGrid;

    constructor(grid: PuzzleGrid) {
        this.grid = grid;
    }
}

class ConstraintEvent extends PuzzleEvent {
    readonly constraints: Array<IConstraint>;
    constructor(grid: PuzzleGrid, constraints: IConstraint[]) {
        super(grid);

        this.constraints = constraints;
    }
}

class CellEvent extends PuzzleEvent {
    readonly cells: Array<Cell>;
    constructor(grid: PuzzleGrid, cells: Cell[]) {
        super(grid);

        this.cells = cells;
    }
}


// puzzle grid handles digits and resolving constraints
class PuzzleGrid {
    private sceneManager: SceneManager;

    // key: cell row and column
    // value: set of constraints affecting the cell
    private constraintMap: BSTMap<Cell, Set<IConstraint>> = new BSTMap();
    private violatedConstraints: Set<IConstraint> = new Set();

    // the set of constraints currently selectd
    private selectedConstraints: Set<IConstraint> = new Set();
    // are any constraints selected
    get hasSelectedConstraints(): boolean {
        return this.selectedConstraints.size > 0;
    }

    // bounding box representation of the selections
    private _selectionBoundingBox: BoundingBox = BoundingBox.Empty;
    get selectionBoundingBox(): BoundingBox {
        return this._selectionBoundingBox;
    }
    // svg bounding box for the selected elements
    private selectionBox: SVGRectElement;

    // digits in cells
    private cellMap: BSTMap<Cell, [CellValue, SVGGElement | SVGTextElement]> = new BSTMap();

    // root element for error highlights
    private errorHighlight: SVGGElement;

    // root element for cell selection highlights
    private highlightSvg: SVGGElement;
    // the cells which are currently highlighted mapped to their associated SVG Rect
    private highlightedCells: BSTMap<Cell, SVGRectElement> = new BSTMap();
    // are any cells highlighted
    get hasHighlightedCells(): boolean {
        return this.highlightedCells.size > 0;
    }
    // the cell that has focus currently
    private _focusedCell: Cell | null = null;

    public get focusedCell(): Cell | null {
        return this._focusedCell;
    }

    constructor(sceneManager: SceneManager) {
        this.sceneManager = sceneManager;
        this.errorHighlight = sceneManager.createElement("g", SVGGElement, RenderLayer.Fill);
        this.highlightSvg = sceneManager.createElement("g", SVGGElement, RenderLayer.Fill);
        this.selectionBox = sceneManager.createElement("rect", SVGRectElement, RenderLayer.Foreground);
        this.selectionBox.setAttributes(
            ["fill", "none"],
            ["stroke", "black"],
            ["stroke-dasharray", "5,6,10,6,5,0"],
            ["stroke-width", "2"],
            ["visibility", "hidden"]);

    }

    // Event Functions

    private listenerRegistry: Map<string, Set<{(event: PuzzleEvent): void}>> = new Map();

    addEventListener(eventType: string, listener: { (event: PuzzleEvent): void}): void {
        let listeners = this.listenerRegistry.get(eventType);
        if (!listeners) {
            listeners = new Set();
            this.listenerRegistry.set(eventType, listeners);
        }
        listeners.add(listener);
    }

    removeEventListener(eventType: string, listener: { (event: PuzzleEvent): void}): void {
        const listeners = this.listenerRegistry.get(eventType);
        if (listeners) {
            listeners.delete(listener);
        }
    }

    private fireEvent(eventType: string, event: PuzzleEvent) {
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

    clearAllHighlights(): void {
        this.highlightedCells.clear();
        this.highlightSvg.clearChildren();
        this._focusedCell = null;

        this.fireEvent(PuzzleEventType.HighlightedCellsChanged, new CellEvent(this, []));
    }

    focusCell(cell: Cell): void {
        this._focusedCell = cell;
    }

    highlightCells(flags: HighlightCellsFlags, ...cells: Cell[]): void {

        // only keep cells in the provided cells array
        // we keep any existing svgs rather then deleting/remaking
        if (flags & HighlightCellsFlags.Clear) {
            this.highlightSvg.clearChildren();
            let highlightedCells: BSTMap<Cell, SVGRectElement> = new BSTMap();
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
            rect.setAttributes(
                ["width", `${CELL_SIZE}`],
                ["height", `${CELL_SIZE}`],
                ["fill", Colour.LightBlue.toString()],
                ["x", `${cell.j * CELL_SIZE}`],
                ["y", `${cell.i * CELL_SIZE}`]);
            this.highlightedCells.set(cell, rect);
            this.highlightSvg.appendChild(rect);
        }

        if (flags & HighlightCellsFlags.Focus) {
            this._focusedCell = <Cell>cells.last();
        }

        this.fireEvent(PuzzleEventType.HighlightedCellsChanged, new CellEvent(this, [...this.highlightedCells.keys()]));
    }

    // toglges cell highlight state
    toggleCell(cell: Cell): void {
        // cell toggle
        let rect = this.highlightedCells.get(cell);
        if (rect) {
            this.highlightedCells.delete(cell);
            this.highlightSvg.removeChild(rect);
            // no focused cell after this point
            this._focusedCell = null;
        } else {
            this.highlightCells(HighlightCellsFlags.Focus, cell);
        }

        this.fireEvent(PuzzleEventType.HighlightedCellsChanged, new CellEvent(this, [...this.highlightedCells.keys()]));
    }

    getHighlightedCells(): Array<Cell> {
        return [...this.highlightedCells.keys()];
    }

    moveFocus(direction: Direction, clearHighlight: boolean): void {
        throwIfNull(this.focusedCell);
        let newFocus: Cell | null = null;
        switch(direction) {
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

    getConstraintsAtCell(cell: Cell): Array<IConstraint> {
        let constraints = this.constraintMap.get(cell);
        if (constraints) {
            return [...constraints.values()];
        } else {
            return [];
        }
    }

    isConstraintSelected(constraint: IConstraint): boolean {
        return this.selectedConstraints.has(constraint);
    }

    selectConstraint(constraint: IConstraint): void {
        this.selectedConstraints.add(constraint);
        this.fireEvent(PuzzleEventType.ConstraintsSelected, new ConstraintEvent(this, [constraint]));
    }

    unselectConstraint(constraint: IConstraint): void {
        this.selectedConstraints.delete(constraint);
        this.fireEvent(PuzzleEventType.ConstraintsDeselected, new ConstraintEvent(this, [constraint]));
    }

    clearSelectedConstraints(): void {
        let selectedConstraints = [...this.selectedConstraints];
        this.selectedConstraints.clear();
        for (let constraint of selectedConstraints) {
            this.unselectConstraint(constraint);
        }
    }

    getSelectedConstraints(): Array<IConstraint> {
        return [...this.selectedConstraints.values()];
    }

    updateSelectionBox(): void {
        // update our visual selection box
        if (this.selectedConstraints.size > 0) {
            // construct list of bounding boxes
            let boundingBoxes: Array<BoundingBox> = new Array();
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
            let height = boundingBox.rows * CELL_SIZE + 2 * MARGIN;;

            this.selectionBox.setAttributes(
                ["x", `${x}`],
                ["y", `${y}`],
                ["width", `${width}`],
                ["height", `${height}`],
                ["visibility", "visible"]);
        } else {
            this._selectionBoundingBox = BoundingBox.Empty;

            this.selectionBox.setAttributes(
                ["visibility", "hidden"]);
        }
    }

    checkCellsForConstraintViolations(...cells: Cell[]) {
        // construct our set of constraints affecting the given cells
        let constraints: Set<IConstraint> = new Set();
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
        let affectedCells: BSTSet<Cell> = new BSTSet();

        // start with our
        for (let constraint of constraints) {
            let cells = constraint.getViolatedCells(this);
            if (cells.size > 0) {
                affectedCells = BSTSet.union(affectedCells,cells);
                this.violatedConstraints.add(constraint);
            } else {
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
                rect.setAttributes(
                    ["x", `${cell.j * CELL_SIZE}`],
                    ["y", `${cell.i * CELL_SIZE}`],
                    ["width", `${CELL_SIZE}`],
                    ["height", `${CELL_SIZE}`],
                    ["fill", Colour.LightRed.toString()]);
                this.errorHighlight.appendChild(rect);
            }
        }
    }

    // adds a constraint and optionally checks to see if its addition affects
    // the set of cells under violated constraints
    addConstraint(constraint: IConstraint, checkViolations?: boolean): void {
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
    removeConstraint(constraint: IConstraint, checkViolations?: boolean): void {
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

    translateConstraints(rows: number, columns: number, constraints: Array<IConstraint>): void {
        if (rows != 0 || columns != 0) {
            throwIfFalse(Number.isInteger(rows));
            throwIfFalse(Number.isInteger(columns));

            // translate all constraints, and note old locations
            // remove all our violated constraints since we're going to re-check
            const oldCells: BSTSet<Cell> = new BSTSet();
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
            const newCells: BSTSet<Cell> = new BSTSet();
            for (let constraint of constraints) {
                for (let cell of constraint.cells) {
                    newCells.add(cell);
                    let constraintsAtCell = this.constraintMap.get(cell);
                    if (constraintsAtCell === undefined) {
                        constraintsAtCell = new Set<IConstraint>();
                        this.constraintMap.set(cell, constraintsAtCell);
                    }
                    constraintsAtCell.add(constraint);
                }
            }

            let cells = BSTSet.union(newCells, oldCells);

            this.checkCellsForConstraintViolations(...cells);
        }
    }

    translateSelectedConstraints(rows: number, columns: number): void {
        if (rows != 0 || columns != 0) {
            this.translateConstraints(rows, columns, [...this.selectedConstraints]);
            this.updateSelectionBox();
        }
    }

    // Cell Setters/Getters

    setCellValue(cell: Cell, value: CellValue, checkViolations?: boolean): void {
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
            text.setAttributes(
                ["text-anchor", "middle"],
                ["dominant-baseline", "central"],
                ["x", `${cell.j * CELL_SIZE + CELL_SIZE/2}`],
                ["y", `${cell.i * CELL_SIZE + CELL_SIZE/2}`],
                ["font-size", `${baseFontSize}`],
                ["font-family", "sans-serif"]);
            text.innerHTML = `${value.digit}`;

            this.cellMap.set(cell, [value, text]);
        } else if (value.centerMark || value.cornerMark) {
            // pencil marks
            let pencilMarks = this.sceneManager.createElement("g", SVGGElement, RenderLayer.PencilMark);
            if (value.centerMark) {
                let digitFlagStr = DigitFlag.toString(value.centerMark);
                let text = this.sceneManager.createElement("text", SVGTextElement);

                const fontSize = baseFontSize * 1.5 / Math.max(4, digitFlagStr.length);

                text.setAttributes(
                    ["text-anchor", "middle"],
                    ["dominant-baseline", "central"],
                    ["x", `${cell.j * CELL_SIZE + CELL_SIZE/2}`],
                    ["y", `${cell.i * CELL_SIZE + CELL_SIZE/2}`],
                    ["font-size", `${fontSize}`],
                    ["font-family", "sans-serif"]);
                text.textContent = digitFlagStr;
                pencilMarks.appendChild(text);
            }
            if (value.cornerMark) {
                let digits = DigitFlag.toDigits(value.cornerMark);
                const count = digits.length;
                throwIfFalse(count > 0 && count <= 9);
                let coords: Array<[number,number]> = new Array();
                const fontSize = baseFontSize / 4;

                switch(count) {
                case 1:
                    coords.push([0.15,0.2]);
                    break;
                case 2:
                    coords.push([0.15,0.2]);
                    coords.push([0.85,0.2]);
                    break;
                case 3:
                    coords.push([0.15,0.2]);
                    coords.push([0.85,0.2]);
                    coords.push([0.15,0.8]);
                    break;
                case 4:
                    coords.push([0.15,0.2]);
                    coords.push([0.85,0.2]);
                    coords.push([0.15,0.8]);
                    coords.push([0.85,0.8]);
                    break;
                case 5:
                    coords.push([0.15,0.2]);
                    coords.push([0.5,0.2]);
                    coords.push([0.85,0.2]);
                    coords.push([0.15,0.8]);
                    coords.push([0.85,0.8]);
                    break;
                case 6:
                    coords.push([0.15,0.2]);
                    coords.push([0.5,0.2]);
                    coords.push([0.85,0.2]);
                    coords.push([0.15,0.8]);
                    coords.push([0.5,0.8]);
                    coords.push([0.85,0.8]);
                    break;
                case 7:
                    coords.push([0.15,0.2]);
                    coords.push([0.3833,0.2]);
                    coords.push([0.6167,0.2]);
                    coords.push([0.85,0.2]);
                    coords.push([0.15,0.8]);
                    coords.push([0.5,0.8]);
                    coords.push([0.85,0.8]);
                    break;
                case 8:
                    coords.push([0.15,0.2]);
                    coords.push([0.3833,0.2]);
                    coords.push([0.6167,0.2]);
                    coords.push([0.85,0.2]);
                    coords.push([0.15,0.8]);
                    coords.push([0.3833,0.8]);
                    coords.push([0.6167,0.8]);
                    coords.push([0.85,0.8]);
                    break;
                case 9:
                    coords.push([0.15,0.2]);
                    coords.push([0.325,0.2]);
                    coords.push([0.5,0.2]);
                    coords.push([0.675,0.2]);
                    coords.push([0.85,0.2]);
                    coords.push([0.15,0.8]);
                    coords.push([0.3833,0.8]);
                    coords.push([0.6167,0.8]);
                    coords.push([0.85,0.8]);
                    break;
                }
                for (let k = 0; k < count; k++) {
                    const [x,y] = coords[k];
                    const digit = digits[k];
                    let text = this.sceneManager.createElement("text", SVGTextElement);
                    text.setAttributes(
                        ["text-anchor", "middle"],
                        ["dominant-baseline", "central"],
                        ["x", `${cell.j * CELL_SIZE + CELL_SIZE * x}`],
                        ["y", `${cell.i * CELL_SIZE + CELL_SIZE * y}`],
                        ["font-size", `${fontSize}`],
                        ["font-family", "sans-serif"]);
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

    deleteCellValue(cell: Cell, checkViolations?: boolean): void {
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

    getCellsWithCondition(filter: {(value: CellValue): boolean}): Array<Cell> {
        let retval = new Array();
        for (let [cell, [value, _element]] of this.cellMap) {
            if (filter(value)) {
                retval.push(cell);
            }
        }
        return retval;
    }

    getDigitAtCell(cell: Cell): Digit | null {
        let retval = this.cellMap.get(cell);
        if (retval !== undefined) {
            let [value, _svg] = retval;
            return value.digit;
        }
        return null;
    }

    getCellValue(cell: Cell): CellValue | null {
        const value = this.cellMap.get(cell);
        return value ? value[0] : null;
    }
}
