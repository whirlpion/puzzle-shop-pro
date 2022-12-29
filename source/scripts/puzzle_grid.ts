
// a puzzle object is the 'owner' of the visual and logical aspects of a puzzle piece
abstract class IConstraint {
    // list of cells [row,column] affected by this constraint
    protected readonly _cells: Array<Cell>;
    // handle for an svg element from the CanvasView that
    private _svg: SVGElement | null;

    // cloneCells(): Array<Cell> {
    //     return this._cells.clone();
    // }
    get cells(): Array<Cell> {
        return this._cells;
    }

    get svg(): SVGElement {
        throwIfNull(this._svg);
        return this._svg;
    }

    //  takes in a list of cells affected by this constraint and a puzzle grid
    constructor(cells: Array<Cell>, svg: SVGElement | null) {
        this._cells = cells;
        this._svg = svg;
    }

    // returns true if the consraint is currently violated, false otherwise
    abstract isConstraintViolated(puzzleGrid: PuzzleGrid): boolean
}

enum Digit {
    One = 1,
    Two,
    Three,
    Four,
    Five,
    Size,
    Seven,
    Eight,
    Nine,
}

namespace Digit {
    export function parse(value: string): Digit {
        let integer = Number.parseInt(value);
        throwIfTrue(isNaN(integer));
        throwIfFalse(integer >= 1 && integer <= 9);
        return integer;
    }
}

class Cell {
    static readonly MAX_VAL = 0xFFFF;

    _i: number;
    _j: number;

    get i(): number {
        return this._i;
    }

    get j(): number {
        return this._j;
    }

    constructor(i: number, j: number) {
        throwIfFalse(Number.isInteger(i) && i >= 0);
        throwIfFalse(Number.isInteger(j) && j >= 0);

        this._i = i;
        this._j = j;
    }

    static fromXY(x: number, y: number): Cell {
        let i = Math.floor(y / CELL_SIZE);
        let j = Math.floor(x / CELL_SIZE);

        return new Cell(i, j);
    }

    toString(): string {
        return `r${this.i}c${this.j}`;
    }

    cmp(that: Cell): Ordering {
        if (this._i < that._i) {
            return Ordering.LessThan;
        } else if (this._i === that._i && this._j < that._j) {
            return Ordering.LessThan;
        } else if (this._i === that._i && this._j === that._j) {
            return Ordering.Equal;
        } else {
            return Ordering.GreaterThan;
        }
    }
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

    // key: cell row and column
    // value: set of constraints affecting the cell
    private constraintMap: Map<string, Set<IConstraint>> = new Map();
    private violatedConstraints: Set<IConstraint> = new Set();
    private digitMap: Map<string, [Digit, SVGTextElement]> = new Map();
    private sceneManager: SceneManager;

    private errorHighlight: SVGGElement;

    constructor(sceneManager: SceneManager, rows: number, columns: number) {
        throwIfFalse(Number.isInteger(rows));
        throwIfFalse(Number.isInteger(columns));

        this._rows = rows;
        this._columns = columns;
        this.sceneManager = sceneManager;
        this.errorHighlight = sceneManager.createElement("g", SVGGElement, RenderLayer.Fill);
        this.errorHighlight.setAttribute("opacity", "1.0");
    }

    // returns the previous digit at that cell if present
    setDigitAtCell(cell: Cell, digit: Digit | null): Digit | null {
        const key = cell.toString();
        let pair = this.digitMap.get(key);
        let retval: Digit | null = null;
        if (pair) {
            let [previousDigit, text] = pair;
            retval = previousDigit;
            // new digit to write
            if (digit) {
                previousDigit = digit;
                text.innerHTML = `${digit}`;
            // otherwise delete entry
            } else {
                this.sceneManager.removeElement(text);
                this.digitMap.delete(key);
            }
        } else {
            // new digit to write
            if (digit) {
                let text = this.sceneManager.createElement("text", SVGTextElement, RenderLayer.PencilMark);
                text.setAttributes(
                    ["text-anchor", "middle"],
                    ["dominant-baseline", "central"],
                    ["x", `${cell.j * CELL_SIZE + CELL_SIZE/2}`],
                    ["y", `${cell.i * CELL_SIZE + CELL_SIZE/2}`],
                    ["font-size", `${CELL_SIZE * 3 / 4}`],
                    ["font-family", "sans-serif"]);
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
                } else {
                    this.violatedConstraints.delete(constraint);
                }
            }

            let affectedCells: BSTSet<Cell> = new BSTSet();
            for (let constraint of this.violatedConstraints) {
                for (let cell of constraint.cells) {
                    affectedCells.add(cell);
                }
            }
            this.errorHighlight.clearChildren();
            console.debug(`Constraint violation! ${affectedCells.size} cells affected:`);
            for (let cell of affectedCells) {
                // may be smarter to do this on a per constraint level then by cell
                console.debug(` ${cell}`);
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

        return retval;
    }

    getDigitAtCell(cell: Cell): Digit | null {
        const key = cell.toString();
        let retval = this.digitMap.get(key);
        if (retval !== undefined) {
            let [digit, _svg] = retval;
            return digit;
        }
        return null;
    }

    addConstraintToCell(cell: Cell, constraint: IConstraint): void {
        const key = cell.toString();
        if(!this.constraintMap.has(key)) {
            this.constraintMap.set(key, new Set());
        }
        let set = this.constraintMap.get(key);
        throwIfNull(set);

        set.add(constraint);
    }

    removeConstraintFromCell(cell: Cell, constraint: IConstraint): void {
        const key = cell.toString();
        let set = this.constraintMap.get(key);
        throwIfNull(set);
        set.delete(constraint);
        if (set.size === 0) {
            this.constraintMap.delete(key);
        }
    }
}

