"use strict";
// a puzzle object is the 'owner' of the visual and logical aspects of a puzzle piece
class RegionConstraint extends IConstraint {
    constructor(cells, boundingBox) {
        super(cells, boundingBox, new Graphic(), `region_${RegionConstraint.counter++}`);
    }
    getViolatedCells(puzzleGrid) {
        let digitsInRegion = new Set();
        for (let cell of this.cells) {
            let digit = puzzleGrid.getDigitAtCell(cell);
            if (digit !== null) {
                if (digitsInRegion.has(digit)) {
                    return new BSTSet(this.cells);
                }
                else {
                    digitsInRegion.add(digit);
                }
            }
        }
        return new BSTSet();
    }
    static RowRegion(cell, size) {
        throwIfFalse(size >= 1 && size <= 9);
        let cells = new Array(size);
        for (let k = 0; k < size; k++) {
            cells[k] = new Cell(cell.i, cell.j + k);
        }
        return new RegionConstraint(cells, new BoundingBox(cell.i, cell.j, 1, size));
    }
    static ColumnRegion(cell, size) {
        throwIfFalse(size >= 1 && size <= 9);
        let cells = new Array(size);
        for (let k = 0; k < size; k++) {
            cells[k] = new Cell(cell.i + k, cell.j);
        }
        return new RegionConstraint(cells, new BoundingBox(cell.i, cell.j, size, 1));
    }
    static SquareRegion(cell, width) {
        throwIfFalse(width >= 1 && width <= 3);
        let cells = new Array(width * width);
        for (let i = 0; i < width; i++) {
            for (let j = 0; j < width; j++) {
                cells[i * width + j] = new Cell(cell.i + i, cell.j + j);
            }
        }
        return new RegionConstraint(cells, new BoundingBox(cell.i, cell.j, width, width));
    }
    static RectangleRegion(cell, width, height) {
        throwIfFalse(width >= 1 && height >= 1 && width * height <= 9);
        let cells = new Array(width * height);
        for (let i = 0; i < height; i++) {
            for (let j = 0; j < width; j++) {
                cells[i * width + j] = new Cell(cell.i + i, cell.j + j);
            }
        }
        return new RegionConstraint(cells, new BoundingBox(cell.i, cell.j, width, width));
    }
    static IrregularRegion(cells) {
        // ensure no repeats in provided cell list
        let cellSet = new BSTSet();
        for (let cell of cells) {
            throwIfTrue(cellSet.has(cell));
            cellSet.add(cell);
        }
        return new RegionConstraint(cells, BoundingBox.fromCells(...cells));
    }
}
RegionConstraint.counter = 0;
