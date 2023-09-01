class Cell implements IOrdered, IEquals {
    static readonly MAX_VAL = 0xFFFF;

    _i: number;
    _j: number;

    get i(): number {
        return this._i;
    }

    get j(): number {
        return this._j;
    }

    // top of the cell region in world coordinates
    get top(): number {
        return this.i * CELL_SIZE;
    }

    // bottom of the cell region in world coordinates
    get bottom(): number {
        return (this.i + 1) * CELL_SIZE;
    }

    // left side of the cell region in world coordinates
    get left(): number {
        return this.j * CELL_SIZE;
    }

    // right side of the cell region in world coordinates
    get right(): number {
        return (this.j + 1) * CELL_SIZE;
    }

    // the horizontal,vertical center of the cell region in world coordinates
    get center(): {x: number, y: number} {
        return {x: (this.j + 0.5) * CELL_SIZE, y: (this.i + 0.5) * CELL_SIZE};
    }

    get northNeighbor(): Cell {
        return new Cell(this.i - 1, this.j);
    }

    get northEastNeighbor(): Cell {
        return new Cell(this.i - 1, this.j + 1);
    }

    get eastNeighbor(): Cell {
        return new Cell(this.i, this.j + 1);
    }

    get southEastNeighbor(): Cell {
        return new Cell(this.i + 1, this.j + 1);
    }

    get southNeighbor(): Cell {
        return new Cell(this.i + 1, this.j);
    }

    get southWestNeighbor(): Cell {
        return new Cell(this.i + 1, this.j - 1);
    }

    get westNeighbor(): Cell {
        return new Cell(this.i, this.j - 1);
    }

    get northWestNeighbor(): Cell {
        return new Cell(this.i - 1, this.j - 1);
    }

    get orthogonalNeighbors(): Array<Cell> {
        return [
            this.northNeighbor,
            this.eastNeighbor,
            this.southNeighbor,
            this.westNeighbor,
        ];
    }

    get diagonalNeighbors(): Array<Cell> {
        return [
            this.northEastNeighbor,
            this.southEastNeighbor,
            this.southWestNeighbor,
            this.northWestNeighbor,
        ];
    }

    get neighbors(): Array<Cell> {
        return [
            this.northNeighbor,
            this.northEastNeighbor,
            this.eastNeighbor,
            this.southEastNeighbor,
            this.southNeighbor,
            this.southWestNeighbor,
            this.westNeighbor,
            this.northWestNeighbor,
        ];
    }

    constructor(i: number, j: number) {
        throwIfFalse(Number.isInteger(i));
        throwIfFalse(Number.isInteger(j));

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

    compare(that: Cell): Ordering {
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

    equals(that: Cell): boolean {
        return this.i == that.i && this.j == that.j;
    }

    static fromXY(x: number, y: number): Cell {
        let i = Math.floor(y / CELL_SIZE);
        let j = Math.floor(x / CELL_SIZE);

        return new Cell(i, j);
    }

    static manhattanDistance(left: Cell, right: Cell): number {
        return Math.abs(left.i - right.i) + Math.abs(left.j - right.j);
    }

    adjacentOrthogonal(that: Cell): boolean {
        return Cell.manhattanDistance(this, that) == 1;
    }

    adjacentDiagonal(that: Cell): boolean {
        return (this.i != that.i && this.j != that.j) &&
               Cell.manhattanDistance(this, that) == 2;
    }

    adjacentKingsMove(that: Cell): boolean {
        return this.adjacentOrthogonal(that) || this.adjacentDiagonal(that);
    }

    toString(): string {
        return `r${this.i}c${this.j}`;
    }
}

enum Direction {
    Up,
    Right,
    Down,
    Left,
}

enum Digit {
    One = 1,
    Two,
    Three,
    Four,
    Five,
    Six,
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

enum DigitFlag {
    None =  0,
    One =   (1 << (Digit.One - 1)),
    Two =   (1 << (Digit.Two - 1)),
    Three = (1 << (Digit.Three - 1)),
    Four =  (1 << (Digit.Four - 1)),
    Five =  (1 << (Digit.Five - 1)),
    Six =   (1 << (Digit.Six - 1)),
    Seven = (1 << (Digit.Seven - 1)),
    Eight = (1 << (Digit.Eight - 1)),
    Nine =  (1 << (Digit.Nine - 1)),
}

namespace DigitFlag {
    export function fromDigit(digit: Digit): DigitFlag {
        return (1 << (digit - 1));
    }

    export function toString(flag: DigitFlag): string {
        return DigitFlag.toDigits(flag).join("");
    }

    export function toDigits(flag: DigitFlag): Array<Digit> {
        let digits: Array<Digit> = new Array();
        for(let k = Digit.One; k <= Digit.Nine; k++) {
            if (flag & DigitFlag.fromDigit(k)) {
                digits.push(k);
            }
        }
        return digits;
    }
}

class CellValue implements IEquals {
    digit: Digit | null = null;
    centerMark: DigitFlag = DigitFlag.None;
    cornerMark: DigitFlag = DigitFlag.None;
    colourMark: DigitFlag = DigitFlag.None;
    private _locked: boolean = false;
    // if a cell is locked, it becomes a constraint
    get locked(): boolean {
        return this._locked;
    }

    constructor() {}

     clone(): CellValue {
        let retval = new CellValue();
        retval.digit = this.digit;
        retval.centerMark = this.centerMark;
        retval.cornerMark = this.cornerMark;
        retval.colourMark = this.colourMark;
        retval._locked = this._locked;
        return retval;
     }

    lock(): void {
        this._locked = true;
    }

    unlock(): void {
        this._locked = false;
    }

    equals(that: CellValue): boolean {
        return this.digit == that.digit &&
               this.centerMark == that.centerMark &&
               this.cornerMark == that.cornerMark &&
               this.colourMark == that.colourMark &&
               this._locked == that._locked;
    }
};