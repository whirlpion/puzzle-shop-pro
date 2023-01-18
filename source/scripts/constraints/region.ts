// a puzzle object is the 'owner' of the visual and logical aspects of a puzzle piece
class RegionConstraint extends IConstraint {
    constructor(cells: Array<Cell>) {
        super(cells, null);
    }

    override getViolatedCells(puzzleGrid: PuzzleGrid): BSTSet<Cell> {
        let digitsInRegion: Set<Digit> = new Set();

        for (let cell of this._cells) {
            let digit = puzzleGrid.getDigitAtCell(cell);
            if (digit !== null) {
                if (digitsInRegion.has(digit)) {
                    return new BSTSet(this._cells)
                } else {
                    digitsInRegion.add(digit);
                }
            }
        }

        return new BSTSet();
    }

    static RowRegion(cell: Cell, size: number): RegionConstraint {
        throwIfFalse(size >= 1 && size <= 9);

        let cells: Array<Cell> = new Array(size);
        for (let k = 0; k < size; k++) {
            cells[k] = new Cell(cell.i, cell.j + k);
        }

        return new RegionConstraint(cells);
    }

    static ColumnRegion(cell: Cell, size: number): RegionConstraint {
        throwIfFalse(size >= 1 && size <= 9);

        let cells: Array<Cell> = new Array(size);
        for (let k = 0; k < size; k++) {
            cells[k] = new Cell(cell.i + k, cell.j);
        }

        return new RegionConstraint(cells);
    }

    static SquareRegion(cell: Cell, width: number): RegionConstraint {
        throwIfFalse(width >= 1 && width <= 3);

        let cells: Array<Cell> = new Array(width*width);
        for (let i = 0; i < width; i++) {
            for (let j = 0; j < width; j++) {
                cells[i*width + j] = new Cell(cell.i + i, cell.j + j);
            }
        }

        return new RegionConstraint(cells);
    }

    static IrregularRegion(cells: Array<Cell>): RegionConstraint {
        // ensure no repeats in provided cell list
        let cellSet: BSTSet<Cell> = new BSTSet();
        for(let cell of cells) {
            throwIfTrue(cellSet.has(cell));
            cellSet.add(cell);
        }

        return new RegionConstraint(cells);
    }
}
