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

    static fromMouseEvent(event: MouseEvent): Cell {
        return Cell.fromXY(event.offsetX, event.offsetY);
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

class PencilMark {
    private digitFlags: number = 0;
    constructor(...digits: Digit[]) {
        for (let digit of digits) {
            this.digitFlags |= (1 << digit);
        }
    }

    hasDigit(digit: Digit): boolean {
        return (this.digitFlags & (1 << digit)) !== 0;
    }
}

class CellValue {
    digit: Digit | null = null;
    centerMark: PencilMark = new PencilMark();
    cornerMark: PencilMark = new PencilMark();
    _locked: boolean = false;
    // if a cell is locked, it becomes a constraint
    get locked(): boolean {
        return this._locked;
    }

    constructor() {}

    lock(): void {
        this._locked = true;
    }

    unlock(): void {
        this._locked = false;
    }
};