"use strict";
class WriteDigitAction extends IAction {
    apply() {
        let cellValue = new CellValue();
        cellValue.digit = this.digit;
        for (let cell of this.cells) {
            this.puzzleGrid.setCellValue(cell, cellValue);
        }
    }
    revert() {
        for (let k = 0; k < this.cells.length; k++) {
            let cellValue = new CellValue();
            cellValue.digit = this.previousDigits[k];
            this.puzzleGrid.setCellValue(this.cells[k], cellValue);
        }
    }
    constructor(puzzleGrid, digit, ...cells) {
        super(`write ${digit} digit to ${cells}`);
        this.previousDigits = new Array();
        this.puzzleGrid = puzzleGrid;
        this.cells = cells;
        this.digit = digit;
        for (let cell of cells) {
            this.previousDigits.push(puzzleGrid.getDigitAtCell(cell));
        }
    }
}
class DigitTool extends CellTool {
    constructor(puzzleGrid, actionStack, sceneManager) {
        super(puzzleGrid, actionStack, sceneManager);
    }
    // writes a digit to the highlighted cells
    writeDigit(digit) {
        // first make sure the key press would result in anything changing
        let actionIsNoop = true;
        let cells = this.puzzleGrid.getHighlightedCells();
        for (let cell of cells) {
            if (this.puzzleGrid.getDigitAtCell(cell) !== digit) {
                actionIsNoop = false;
                break;
            }
        }
        if (actionIsNoop) {
            return;
        }
        let action = new WriteDigitAction(this.puzzleGrid, digit, ...cells);
        this.actionStack.doAction(action);
    }
}
