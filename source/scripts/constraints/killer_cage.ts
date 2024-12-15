class KillerCageConstraint extends IConstraint {
    private static counter: number = 0;
    private regionConstraint: RegionConstraint;
    public constructor(cells: Array<Cell>, graphic: Graphic) {
        super(cells, BoundingBox.fromCells(...cells), graphic, `killer_cage_${KillerCageConstraint.counter++}`);
        this.regionConstraint = RegionConstraint.IrregularRegion(cells);
    }

    override getViolatedCells(puzzleGrid: PuzzleGrid): BSTSet<Cell> {
        return this.regionConstraint.getViolatedCells(puzzleGrid);
    }
}
