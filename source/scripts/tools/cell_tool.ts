abstract class CellTool extends ITool {

    constructor(puzzleGrid: PuzzleGrid, actionStack: UndoRedoStack, sceneManager: SceneManager) {
        super(puzzleGrid, actionStack, sceneManager);
    }

    protected abstract writeDigit(digit: Digit | null): void;

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
