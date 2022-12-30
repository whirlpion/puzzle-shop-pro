
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

    static bresenhamLine(from: Cell, to: Cell): Array<Cell> {
        let cells: Array<Cell> = [];
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

    static fromXY(x: number, y: number): Cell {
        let i = Math.floor(y / CELL_SIZE);
        let j = Math.floor(x / CELL_SIZE);

        return new Cell(i, j);
    }

    static fromMouseEvent(event: MouseEvent): Cell {
        return Cell.fromXY(event.offsetX, event.offsetY);
    }

    toString(): string {
        return `r${this.i}c${this.j}`;
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
    private constraintMap: BSTMap<Cell, Set<IConstraint>> = new BSTMap();
    private violatedConstraints: Set<IConstraint> = new Set();
    private digitMap: BSTMap<Cell, [Digit, SVGTextElement]> = new BSTMap();
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

    // returns the previous digit at that cell if present
    setDigitAtCell(cell: Cell, digit: Digit | null): Digit | null {
        let pair = this.digitMap.get(cell);
        let retval: Digit | null = null;
        if (pair) {
            // pair[0] : Digit
            // pair[1] : SVGTextElement
            retval = pair[0];
            // new digit to write
            if (digit) {
                pair[0] = digit;
                pair[1].innerHTML = `${digit}`;
            // otherwise delete entry
            } else {
                this.sceneManager.removeElement(pair[1]);
                this.digitMap.delete(cell);
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
                this.digitMap.set(cell, [digit, text]);
            }
        }

        this.checkCellsForConstraintViolations(cell);
        return retval;
    }

    getDigitAtCell(cell: Cell): Digit | null {
        let retval = this.digitMap.get(cell);
        if (retval !== undefined) {
            let [digit, _svg] = retval;
            return digit;
        }
        return null;
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
}

