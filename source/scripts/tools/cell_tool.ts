abstract class CellTool extends ITool {

    constructor(puzzleGrid: PuzzleGrid, actionStack: UndoRedoStack, sceneManager: SceneManager) {
        super(puzzleGrid, actionStack, sceneManager);
    }

    protected abstract writeDigit(digit: Digit): void;

    deleteDigit(): void {
        let cells = this.puzzleGrid.getHighlightedCells();
        if (cells.length > 0) {
            const action = new DeleteCellValueAction(this.puzzleGrid, cells);
            this.actionStack.doAction(action);
        }
    }

    override handlePutDown(nextTool: ITool) {
        if (!(nextTool instanceof CellTool)) {
            this.puzzleGrid.clearAllHighlights();
        }
    }

    override handleMouseDoubleClick(event: MouseEvent): void {
        const cell = Cell.fromMouseEvent(event);
        const digit = this.puzzleGrid.getDigitAtCell(cell);
        if (digit) {
            const matchingCells = this.puzzleGrid.getCellsWithDigit(digit);

            this.puzzleGrid.highlightCells(HighlightCellsFlags.Focus | HighlightCellsFlags.Clear, ...matchingCells);
        } else {
            this.puzzleGrid.highlightCells(HighlightCellsFlags.Focus | HighlightCellsFlags.Clear, cell);
        }
    }

    // ctrl+click toggles individual cells
    // shift+click should select all cells between current and previous click
    // click clears current selection set and sets current cell
    override handleMouseDown(event: MouseEvent) {
        // only care about 'left' click
        if (!event.primaryButton) {
            return;
        }

        // unclear which thing the user wants to do, so best to do nothing
        if (event.shiftKey && event.shortcutKey) {
            return;
        }

        const cell = Cell.fromMouseEvent(event);

        if (event.shortcutKey) {
            this.puzzleGrid.toggleCell(cell);
        } else if (event.shiftKey && this.puzzleGrid.focusedCell) {
            // cell line
            const line = Cell.bresenhamLine(this.puzzleGrid.focusedCell, cell);
            this.puzzleGrid.highlightCells(HighlightCellsFlags.Focus, ...line);
        } else {
            this.puzzleGrid.highlightCells(HighlightCellsFlags.Focus | HighlightCellsFlags.Clear, cell);
        }
    }

    override handleMouseUp(_event: MouseEvent) {
        // console.log(`mouseup: ${event.offsetX},${event.offsetY}`);
    }

    override handleMouseMove(event: MouseEvent) {
        // only care about click and drag
        if (!event.primaryButton || !this.puzzleGrid.focusedCell) {
            return;
        }

        const cell = Cell.fromMouseEvent(event);
        const line = Cell.bresenhamLine(this.puzzleGrid.focusedCell, cell);
        this.puzzleGrid.highlightCells(HighlightCellsFlags.Focus, ...line);
    }

    override handleKeyDown(event: KeyboardEvent) {
        console.log(`code: ${event.code} key: ${event.key}`);
        if (this.puzzleGrid.hasHighlightedCells) {
            switch(event.key) {
            case "1": case "2": case "3":
            case "4": case "5": case "6":
            case "7": case "8": case "9":
                this.writeDigit(Digit.parse(event.key));
                break;
            case "Backspace": case "Delete":
                this.deleteDigit();;
                break;
            case "ArrowUp":
                this.puzzleGrid.moveFocus(Direction.Up, !event.shiftKey);
                break;
            case "ArrowRight":
                this.puzzleGrid.moveFocus(Direction.Right, !event.shiftKey);
                break;
            case "ArrowDown":
                this.puzzleGrid.moveFocus(Direction.Down, !event.shiftKey);
                break;
            case "ArrowLeft":
                this.puzzleGrid.moveFocus(Direction.Left, !event.shiftKey);
                break;
            default:
                console.log(`unhandled key press: ${event.key}`);
                return;
            }
            event.preventDefault();
        }
    }
}

class WriteCellValueAction extends IAction {
    override apply(): void {
        const length = this.cells.length;
        for (let k = 0; k < length; k++) {
            const cell = this.cells[k];
            const value = this.newValues[k];
            this.puzzleGrid.setCellValue(cell, value);
        }
    }
    override revert(): void {
        const length = this.cells.length;
        for (let k = 0; k < length; k++) {
            const cell = this.cells[k];
            const value = this.oldValues[k];
            if (value !== null) {
                this.puzzleGrid.setCellValue(cell, value);
            } else {
                this.puzzleGrid.deleteCellValue(cell);
            }
        }
    }

    puzzleGrid: PuzzleGrid;
    cells: Array<Cell>;
    newValues: Array<CellValue>;
    oldValues: Array<CellValue | null>;

    constructor(puzzleGrid: PuzzleGrid, cells: Array<Cell>, values: Array<CellValue>) {
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
    override apply(): void {
        for (let cell of this.cells) {
            this.puzzleGrid.deleteCellValue(cell);
        }
    }

    override revert(): void {
        throwIfNotEqual(this.cells.length, this.oldValues.length);
        const length = this.cells.length;
        for (let k = 0; k < length; k++) {
            const cell = this.cells[k];
            const value = this.oldValues[k];
            this.puzzleGrid.setCellValue(cell, value);
        }
    }

    puzzleGrid: PuzzleGrid;
    cells: Array<Cell> = new Array();
    oldValues: Array<CellValue> = new Array();

    constructor(puzzleGrid: PuzzleGrid, cells: Array<Cell>) {
        super(`deleting cells: ${cells.map(c => c.toString()).join()}`);
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

    constructor(puzzleGrid: PuzzleGrid, actionStack: UndoRedoStack, sceneManager: SceneManager) {
        super(puzzleGrid, actionStack, sceneManager);
    }

    // writes a digit to the highlighted cells
    override writeDigit(digit: Digit): void {
        let cells: Array<Cell> = new Array();
        let values: Array<CellValue> = new Array();
        for (let cell of this.puzzleGrid.getHighlightedCells()) {
            let value = this.puzzleGrid.getCellValue(cell);
            // update existing cell
            if (value?.digit === digit) {
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

    constructor(puzzleGrid: PuzzleGrid, actionStack: UndoRedoStack, sceneManager: SceneManager) {
        super(puzzleGrid, actionStack, sceneManager);
    }

    // write a center mark to the high lighted cells
    override writeDigit(digit: Digit): void {
        const digitFlag = DigitFlag.fromDigit(digit);

        // first determine if we are adding or removing
        const highlightedCells = this.puzzleGrid.getHighlightedCells();
        let addingDigit: boolean = false;
        for (let cell of highlightedCells) {
            let value = this.puzzleGrid.getCellValue(cell);
            if ((value === null) || !(value.centerMark & digitFlag)) {
                addingDigit = true;
                break;
            }
        }

        console.log(`addingDigit: ${addingDigit}`);

        // next create our new cell/cell value pairs
        let cells: Array<Cell> = new Array();
        let values: Array<CellValue> = new Array();
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
                    console.log('adding digit');
                    value.centerMark |= digitFlag;
                } else {
                    console.log('removing digit');
                    value.centerMark ^= digitFlag;
                }
                values.push(value);
            // new cell
            } else {
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