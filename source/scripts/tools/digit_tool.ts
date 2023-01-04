class WriteDigitAction extends IAction {
    override apply(): void {
        let cellValue = new CellValue();
        cellValue.digit = this.digit;
        for (let cell of this.cells) {
            this.puzzleGrid.setCellValue(cell, cellValue);
        }
    }
    override revert(): void {
        for(let k = 0; k < this.cells.length; k++) {
            let cellValue = new CellValue();
            cellValue.digit = this.previousDigits[k];
            this.puzzleGrid.setCellValue(this.cells[k], cellValue);
        }
    }

    puzzleGrid: PuzzleGrid;
    digit: Digit | null;
    cells: Array<Cell>;
    previousDigits: Array<Digit | null> = new Array();

    constructor(puzzleGrid: PuzzleGrid, digit: Digit | null, ...cells: Cell[]) {
        super(`write ${digit} digit to ${cells}`);
        this.puzzleGrid = puzzleGrid;
        this.cells = cells;
        this.digit = digit;

        for(let cell of cells) {
            this.previousDigits.push(puzzleGrid.getDigitAtCell(cell));
        }
    }
}

class DigitTool extends CellTool {

    constructor(puzzleGrid: PuzzleGrid, actionStack: UndoRedoStack, sceneManager: SceneManager) {
        super(puzzleGrid, actionStack, sceneManager);
    }

    // writes a digit to the highlighted cells
    override writeDigit(digit: Digit | null): void {
        // first make sure the key press would result in anything changing
        let actionIsNoop = true;
        let cells = this.puzzleGrid.getHighlightedCells();
        for(let cell of cells) {
            if (this.puzzleGrid.getDigitAtCell(cell) !== digit) {
                actionIsNoop = false;
                break;
            }
        }

        if(actionIsNoop) {
            return;
        }

        let action = new WriteDigitAction(this.puzzleGrid, digit, ...cells);
        this.actionStack.doAction(action);
    }
}
