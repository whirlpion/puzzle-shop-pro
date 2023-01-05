"use strict";
class CellTool extends ITool {
    constructor(puzzleGrid, actionStack, sceneManager) {
        super(puzzleGrid, actionStack, sceneManager);
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
            const matchingCells = this.puzzleGrid.getCellsWithDigit(digit);
            this.puzzleGrid.highlightCells(HighlightCellsFlags.Focus | HighlightCellsFlags.Clear, ...matchingCells);
        }
        else {
            this.puzzleGrid.highlightCells(HighlightCellsFlags.Focus | HighlightCellsFlags.Clear, cell);
        }
    }
    // ctrl+click toggles individual cells
    // shift+click should select all cells between current and previous click
    // click clears current selection set and sets current cell
    handleMouseDown(event) {
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
        }
        else if (event.shiftKey && this.puzzleGrid.focusedCell) {
            // cell line
            const line = Cell.bresenhamLine(this.puzzleGrid.focusedCell, cell);
            this.puzzleGrid.highlightCells(HighlightCellsFlags.Focus, ...line);
        }
        else {
            this.puzzleGrid.highlightCells(HighlightCellsFlags.Focus | HighlightCellsFlags.Clear, cell);
        }
    }
    handleMouseUp(_event) {
        // console.log(`mouseup: ${event.offsetX},${event.offsetY}`);
    }
    handleMouseMove(event) {
        // only care about click and drag
        if (!event.primaryButton || !this.puzzleGrid.focusedCell) {
            return;
        }
        const cell = Cell.fromMouseEvent(event);
        const line = Cell.bresenhamLine(this.puzzleGrid.focusedCell, cell);
        this.puzzleGrid.highlightCells(HighlightCellsFlags.Focus, ...line);
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
                    break;
                case "Backspace":
                case "Delete":
                    this.writeDigit(null);
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
