"use strict";
class CellTool extends ITool {
    constructor(puzzleGrid, actionStack, sceneManager) {
        super(puzzleGrid, actionStack, sceneManager);
    }
    deleteDigit() {
        let cells = this.puzzleGrid.getHighlightedCells();
        if (cells.length > 0) {
            const action = new DeleteCellValueAction(this.puzzleGrid, cells);
            this.actionStack.doAction(action);
        }
    }
    handlePutDown(nextTool) {
        if (!(nextTool instanceof CellTool)) {
            this.puzzleGrid.clearAllHighlights();
        }
    }
    handleMouseDoubleClick(event) {
        const cell = Cell.fromMouseEvent(event);
        const digit = this.puzzleGrid.getDigitAtCell(cell);
        if (digit) {
            const matchingCells = this.puzzleGrid.getCellsWithCondition((value) => value.digit == digit);
            this.puzzleGrid.highlightCells(HighlightCellsFlags.Focus | HighlightCellsFlags.Clear, ...matchingCells);
        }
        else {
            this.puzzleGrid.highlightCells(HighlightCellsFlags.Focus | HighlightCellsFlags.Clear, cell);
        }
        return true;
    }
    // ctrl+click toggles individual cells
    // shift+click should select all cells between current and previous click
    // click clears current selection set and sets current cell
    handleMouseDown(event) {
        // only care about 'left' click
        if (!event.primaryButton) {
            return false;
        }
        // unclear which thing the user wants to do, so best to do nothing
        if (event.shiftKey && event.shortcutKey) {
            return false;
        }
        const cell = Cell.fromMouseEvent(event);
        if (event.shortcutKey) {
            this.puzzleGrid.toggleCell(cell);
        }
        else if (event.shiftKey && this.puzzleGrid.focusedCell) {
            // cell line
            const line = Cell.bresenhamLine(this.puzzleGrid.focusedCell, cell);
            this.puzzleGrid.highlightCells(HighlightCellsFlags.Focus, ...line);
        }
        else {
            this.puzzleGrid.highlightCells(HighlightCellsFlags.Focus | HighlightCellsFlags.Clear, cell);
        }
        return true;
    }
    handleMouseMove(event) {
        // only care about click and drag
        if (!event.primaryButton || !this.puzzleGrid.focusedCell) {
            return false;
        }
        const cell = Cell.fromMouseEvent(event);
        const line = Cell.bresenhamLine(this.puzzleGrid.focusedCell, cell);
        this.puzzleGrid.highlightCells(HighlightCellsFlags.Focus, ...line);
        return true;
    }
    handleKeyDown(event) {
        console.log(`code: ${event.code} key: ${event.key}`);
        if (this.puzzleGrid.hasHighlightedCells) {
            switch (event.key) {
                case "1":
                case "2":
                case "3":
                case "4":
                case "5":
                case "6":
                case "7":
                case "8":
                case "9":
                    this.writeDigit(Digit.parse(event.key));
                    return true;
                case "Backspace":
                case "Delete":
                    this.deleteDigit();
                    return true;
                case "ArrowUp":
                    this.puzzleGrid.moveFocus(Direction.Up, !event.shiftKey);
                    return true;
                case "ArrowRight":
                    this.puzzleGrid.moveFocus(Direction.Right, !event.shiftKey);
                    return true;
                case "ArrowDown":
                    this.puzzleGrid.moveFocus(Direction.Down, !event.shiftKey);
                    return true;
                case "ArrowLeft":
                    this.puzzleGrid.moveFocus(Direction.Left, !event.shiftKey);
                    return true;
            }
        }
        if (event.shortcutKey) {
            switch (event.code) {
                case "KeyA":
                    // select all cells with values
                    {
                        const cells = this.puzzleGrid.getCellsWithCondition((_value) => true);
                        this.puzzleGrid.highlightCells(HighlightCellsFlags.Clear, ...cells);
                        return true;
                    }
                    return true;
            }
        }
        return false;
    }
}
class WriteCellValueAction extends IAction {
    apply() {
        const length = this.cells.length;
        for (let k = 0; k < length; k++) {
            const cell = this.cells[k];
            const value = this.newValues[k];
            this.puzzleGrid.setCellValue(cell, value);
        }
        this.puzzleGrid.checkCellsForConstraintViolations(...this.cells);
    }
    revert() {
        const length = this.cells.length;
        for (let k = 0; k < length; k++) {
            const cell = this.cells[k];
            const value = this.oldValues[k];
            if (value !== null) {
                this.puzzleGrid.setCellValue(cell, value);
            }
            else {
                this.puzzleGrid.deleteCellValue(cell);
            }
        }
        this.puzzleGrid.checkCellsForConstraintViolations(...this.cells);
    }
    constructor(puzzleGrid, cells, values) {
        super(`writing values to cells: ${cells.map(cell => cell.toString()).join()}`);
        throwIfNotEqual(cells.length, values.length);
        this.puzzleGrid = puzzleGrid;
        this.cells = cells;
        this.newValues = values;
        this.oldValues = new Array();
        for (let cell of cells) {
            const value = puzzleGrid.getCellValue(cell);
            this.oldValues.push(value ? value : null);
        }
    }
}
class DeleteCellValueAction extends IAction {
    apply() {
        for (let cell of this.cells) {
            this.puzzleGrid.deleteCellValue(cell);
        }
        this.puzzleGrid.checkCellsForConstraintViolations(...this.cells);
    }
    revert() {
        throwIfNotEqual(this.cells.length, this.oldValues.length);
        const length = this.cells.length;
        for (let k = 0; k < length; k++) {
            const cell = this.cells[k];
            const value = this.oldValues[k];
            this.puzzleGrid.setCellValue(cell, value);
        }
        this.puzzleGrid.checkCellsForConstraintViolations(...this.cells);
    }
    constructor(puzzleGrid, cells) {
        super(`deleting cells: ${cells.map(c => c.toString()).join()}`);
        this.cells = new Array();
        this.oldValues = new Array();
        this.puzzleGrid = puzzleGrid;
        for (let cell of cells) {
            let value = puzzleGrid.getCellValue(cell);
            if (value) {
                this.cells.push(cell);
                this.oldValues.push(value);
            }
        }
    }
}
class DigitTool extends CellTool {
    constructor(puzzleGrid, actionStack, sceneManager) {
        super(puzzleGrid, actionStack, sceneManager);
    }
    // writes a digit to the highlighted cells
    writeDigit(digit) {
        let cells = new Array();
        let values = new Array();
        for (let cell of this.puzzleGrid.getHighlightedCells()) {
            let value = this.puzzleGrid.getCellValue(cell);
            // update existing cell
            if ((value === null || value === void 0 ? void 0 : value.digit) === digit) {
                continue;
            }
            cells.push(cell);
            value = new CellValue();
            value.digit = digit;
            values.push(value);
        }
        throwIfNotEqual(cells.length, values.length);
        if (cells.length > 0) {
            const action = new WriteCellValueAction(this.puzzleGrid, cells, values);
            this.actionStack.doAction(action);
        }
    }
}
class CenterTool extends CellTool {
    constructor(puzzleGrid, actionStack, sceneManager) {
        super(puzzleGrid, actionStack, sceneManager);
    }
    // write a center mark to the high lighted cells
    writeDigit(digit) {
        const digitFlag = DigitFlag.fromDigit(digit);
        // first determine if we are adding or removing
        const highlightedCells = this.puzzleGrid.getHighlightedCells();
        let addingDigit = false;
        for (let cell of highlightedCells) {
            let value = this.puzzleGrid.getCellValue(cell);
            if ((value === null) || !(value.centerMark & digitFlag)) {
                addingDigit = true;
                break;
            }
        }
        // next create our new cell/cell value pairs
        let cells = new Array();
        let values = new Array();
        for (let cell of highlightedCells) {
            let value = this.puzzleGrid.getCellValue(cell);
            // update existing cell
            if (value) {
                if (value.digit) {
                    continue;
                }
                if (addingDigit && (value.centerMark & digitFlag)) {
                    continue;
                }
                if (!addingDigit && !(value.centerMark & digitFlag)) {
                    continue;
                }
                cells.push(cell);
                value = value.clone();
                if (addingDigit) {
                    value.centerMark |= digitFlag;
                }
                else {
                    value.centerMark ^= digitFlag;
                }
                values.push(value);
                // new cell
            }
            else {
                cells.push(cell);
                value = new CellValue();
                value.centerMark |= digitFlag;
                values.push(value);
            }
        }
        throwIfNotEqual(cells.length, values.length);
        if (cells.length > 0) {
            let action = new WriteCellValueAction(this.puzzleGrid, cells, values);
            this.actionStack.doAction(action);
        }
    }
}
class CornerTool extends CellTool {
    constructor(puzzleGrid, actionStack, sceneManager) {
        super(puzzleGrid, actionStack, sceneManager);
    }
    // write a center mark to the high lighted cells
    writeDigit(digit) {
        const digitFlag = DigitFlag.fromDigit(digit);
        // first determine if we are adding or removing
        const highlightedCells = this.puzzleGrid.getHighlightedCells();
        let addingDigit = false;
        for (let cell of highlightedCells) {
            let value = this.puzzleGrid.getCellValue(cell);
            if ((value === null) || !(value.cornerMark & digitFlag)) {
                addingDigit = true;
                break;
            }
        }
        // next create our new cell/cell value pairs
        let cells = new Array();
        let values = new Array();
        for (let cell of highlightedCells) {
            let value = this.puzzleGrid.getCellValue(cell);
            // update existing cell
            if (value) {
                if (value.digit) {
                    continue;
                }
                if (addingDigit && (value.cornerMark & digitFlag)) {
                    continue;
                }
                if (!addingDigit && !(value.cornerMark & digitFlag)) {
                    continue;
                }
                cells.push(cell);
                value = value.clone();
                if (addingDigit) {
                    value.cornerMark |= digitFlag;
                }
                else {
                    value.cornerMark ^= digitFlag;
                }
                values.push(value);
                // new cell
            }
            else {
                cells.push(cell);
                value = new CellValue();
                value.cornerMark |= digitFlag;
                values.push(value);
            }
        }
        throwIfNotEqual(cells.length, values.length);
        if (cells.length > 0) {
            let action = new WriteCellValueAction(this.puzzleGrid, cells, values);
            this.actionStack.doAction(action);
        }
    }
}
