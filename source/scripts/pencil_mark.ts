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