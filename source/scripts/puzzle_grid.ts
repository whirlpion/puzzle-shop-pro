
// a puzzle object is the 'owner' of the visual and logical aspects of a puzzle piece
abstract class IConstraint {
    // list of cells [row,column] affected by this constraint
    protected readonly _cells: Array<Cell>;
    // handle for an svg element from the CanvasView that
    private _svg: SVGElement | null;

    get cells(): Array<Cell> {
        return this._cells;
    }

    get svg(): SVGElement {
        throwIfNull(this._svg);
        return this._svg;
    }

    //  takes in a list of cells affected by this constraint and an svg element for display
    constructor(cells: Array<Cell>, svg: SVGElement | null) {
        this._cells = cells;
        this._svg = svg;
    }

    // returns true if the consraint is currently violated, false otherwise
    abstract isConstraintViolated(puzzleGrid: PuzzleGrid): boolean
}

enum HighlightCellsFlags {
    None = 0,
    Focus = 1 << 0,// foucs the last cell in the list
    Clear = 1 << 1, // should all the other cells be removed
}

// puzzle grid handles digits and resolving constraints
class PuzzleGrid {
    // puzzle grid dimensions
    private _rows: number;
    private _columns: number;

    public get rows(): number {
        return this._rows;
    }

    public get columns(): number {
        return this._columns;
    }

    private sceneManager: SceneManager;
    // key: cell row and column
    // value: set of constraints affecting the cell
    private constraintMap: BSTMap<Cell, Set<IConstraint>> = new BSTMap();
    private violatedConstraints: Set<IConstraint> = new Set();
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
    // the cell that has focus
    private _focusedCell: Cell | null = null;

    public get focusedCell(): Cell | null {
        return this._focusedCell;
    }

    constructor(sceneManager: SceneManager, rows: number, columns: number) {
        throwIfFalse(Number.isInteger(rows));
        throwIfFalse(Number.isInteger(columns));

        this._rows = rows;
        this._columns = columns;
        this.sceneManager = sceneManager;
        this.errorHighlight = sceneManager.createElement("g", SVGGElement, RenderLayer.Fill);
        this.highlightSvg = sceneManager.createElement("g", SVGGElement, RenderLayer.Fill);
    }

    // Highlight Functions

    clearAllHighlights(): void {
        this.highlightedCells.clear();
        this.highlightSvg.clearChildren();
        this._focusedCell = null;
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
    }

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
    }

    getHighlightedCells(): Array<Cell> {
        return Array.collect(this.highlightedCells.keys());
    }

    moveFocus(direction: Direction, clearHighlight: boolean): void {
        throwIfNull(this.focusedCell);
        let newFocus: Cell | null = null;
        switch(direction) {
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

    checkCellsForConstraintViolations(...cells: Cell[]) {
        // checks each of the requested cells
        for(let cell of cells) {
            // identify all the constraints affecting the current cell
            let constraintsOnCell = this.constraintMap.get(cell);
            if (constraintsOnCell) {
                // determine if the constraint is violated
                for (let constraint of constraintsOnCell) {
                    if (constraint.isConstraintViolated(this)) {
                        this.violatedConstraints.add(constraint);
                    } else {
                        this.violatedConstraints.delete(constraint);
                    }
                }
            }
        }

        // now construct set of all cells within the violated constraints area
        let affectedCells: BSTSet<Cell> = new BSTSet();
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
                rect.setAttributes(
                    ["x", `${cell.j * CELL_SIZE}`],
                    ["y", `${cell.i * CELL_SIZE}`],
                    ["width", `${CELL_SIZE}`],
                    ["height", `${CELL_SIZE}`],
                    ["fill", Colour.Pink.toString()]);
                this.errorHighlight.appendChild(rect);
            }
        }
    }

    // adds a constraint and optionally checks to see if its addition affects
    // the set of cells under violated constraints
    addConstraint(constraint: IConstraint, checkViolations?: boolean, ): void {
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
    removeConstraint(constraint: IConstraint, checkViolations?: boolean): void {
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

    setCellValue(cell: Cell, value: CellValue, checkViolations?: boolean): void {
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

