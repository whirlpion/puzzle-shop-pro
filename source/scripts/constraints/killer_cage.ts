class KillerCageConstraint extends IConstraint {
    private static counter: number = 0;
    private regionConstraint: RegionConstraint;
    private sum: number;
    public constructor(cells: Array<Cell>, sum: number, graphic: Graphic) {
        super(cells, BoundingBox.fromCells(...cells), graphic, `killer_cage_${KillerCageConstraint.counter++}`);
        this.regionConstraint = RegionConstraint.IrregularRegion(cells);
        this.sum = sum;
    }

    override getViolatedCells(puzzleGrid: PuzzleGrid): BSTSet<Cell> {
        let result = this.regionConstraint.getViolatedCells(puzzleGrid);
        let sum = 0;
        for (let cell of this.cells) {
            let digit = puzzleGrid.getDigitAtCell(cell);
            sum += <number>digit;
        }

        if (this.sum < sum) {
            result.add(...this.cells);
        }

        return result;
    }
}
