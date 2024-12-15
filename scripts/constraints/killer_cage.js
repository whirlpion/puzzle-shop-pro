"use strict";
class KillerCageConstraint extends IConstraint {
    constructor(cells, sum, graphic) {
        super(cells, BoundingBox.fromCells(...cells), graphic, `killer_cage_${KillerCageConstraint.counter++}`);
        this.regionConstraint = RegionConstraint.IrregularRegion(cells);
        this.sum = sum;
    }
    getViolatedCells(puzzleGrid) {
        let result = this.regionConstraint.getViolatedCells(puzzleGrid);
        let sum = 0;
        for (let cell of this.cells) {
            let digit = puzzleGrid.getDigitAtCell(cell);
            sum += digit;
        }
        if (this.sum < sum) {
            result.add(...this.cells);
        }
        return result;
    }
}
KillerCageConstraint.counter = 0;
