class ThermoConstraint extends IConstraint {
    private static counter: number = 0;
    constructor(cells: Array<Cell>, svg: SVGGElement) {
        super(cells, BoundingBox.fromCells(...cells), svg, `thermo_${ThermoConstraint.counter++}`);
    }

    override getViolatedCells(puzzleGrid: PuzzleGrid): BSTSet<Cell> {

        if (this.cells.length > 9) {
            return new BSTSet(this.cells);
        }

        let prevDigit = 0;
        for (let i = 1; i <= this.cells.length; i++) {
            const cell = this.cells[i-1];
            let digit = puzzleGrid.getDigitAtCell(cell);
            if (digit == null) {
                prevDigit++;
            } else if (prevDigit >= digit) {
                return new BSTSet(this.cells);
            } else {
                const minDigit = prevDigit + 1;
                const maxDigit = 9 - (this.cells.length - i);
                if (digit < minDigit || digit > maxDigit) {
                    return new BSTSet(this.cells);
                }
                prevDigit = digit;
            }
        }
        return new BSTSet();
    }
}