"use strict";
// a puzzle object is the 'owner' of the visual and logical aspects of a puzzle piece
class RegionConstraint extends IConstraint {
    constructor(cells) {
        super(cells, null);
    }
    isConstraintViolated(puzzleGrid) {
        let digitsInRegion = new Set();
        for (let cell of this._cells) {
            let digit = puzzleGrid.getDigitAtCell(cell);
            if (digit !== null) {
                if (digitsInRegion.has(digit)) {
                    return true;
                }
                else {
                    digitsInRegion.add(digit);
                }
            }
        }
        return false;
    }
    static RowRegion(row, column, size) {
        throwIfFalse(size >= 1 && size <= 9);
        throwIfFalse(row >= 0);
        throwIfFalse(column >= 0);
        let cells = new Array(size);
        for (let k = 0; k < size; k++) {
            cells[k] = new Cell(row, column + k);
        }
        return new RegionConstraint(cells);
    }
    static ColumnRegion(row, column, size) {
        throwIfFalse(size >= 1 && size <= 9);
        throwIfFalse(row >= 0);
        throwIfFalse(column >= 0);
        let cells = new Array(size);
        for (let k = 0; k < size; k++) {
            cells[k] = new Cell(row + k, column);
        }
        return new RegionConstraint(cells);
    }
    static SquareRegion(row, column, width) {
        throwIfFalse(width >= 1 && width <= 3);
        let cells = new Array(width * width);
        for (let i = 0; i < width; i++) {
            for (let j = 0; j < width; j++) {
                cells[i * width + j] = new Cell(row + i, column + j);
            }
        }
        return new RegionConstraint(cells);
    }
    static IrregularRegion(cells) {
        // ensure no repeats in provided cell list
        let cellSet = new BSTSet();
        for (let cell of cells) {
            throwIfTrue(cellSet.has(cell));
            cellSet.add(cell);
        }
        return new RegionConstraint(cells);
    }
}
