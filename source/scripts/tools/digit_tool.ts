class WriteDigitAction extends IAction{
    override apply(): void {
        this.puzzleGrid.setDigitAtCell(this.cell, this.digit);
    }
    override revert(): void {
        this.puzzleGrid.setDigitAtCell(this.cell, this.previousDigit);
    }

    puzzleGrid: PuzzleGrid;
    cell: Cell;
    digit: Digit;
    previousDigit: Digit | null = null;

    constructor(puzzleGrid: PuzzleGrid, cell: Cell, digit: Digit, previousDigit: Digit | null) {
        super(`write ${digit} digit to ${cell}`);
        this.puzzleGrid = puzzleGrid;
        this.cell = cell;
        this.digit = digit;
        this.previousDigit = previousDigit;
    }
}

class DigitTool extends ITool {
    // the cells which are currently highlighted
    highlights: BSTSet<Cell> = new BSTSet();
    // a group containing a list of elements used to highlight a cell
    highlightSvg: SVGGElement;
    // the cell that has focus
    focusedCell: Cell | null = null;

    constructor(puzzleGrid: PuzzleGrid, actionStack: UndoRedoStack, sceneManager: SceneManager) {
        super(puzzleGrid, actionStack, sceneManager);
        let svg = this.sceneManager.createElement("g", SVGGElement, RenderLayer.Fill);
        this.highlightSvg = svg;
        this.puzzleGrid = puzzleGrid;
    }

    override handleMouseClick(event: MouseEvent) {
        let cell = Cell.fromXY(event.offsetX, event.offsetY);
        this.focusedCell = cell;

        this.highlightSvg.clearChildren();
        let rect = this.sceneManager.createElement("rect", SVGRectElement);
        rect.setAttributes(
            ["width", `${CELL_SIZE}`],
            ["height", `${CELL_SIZE}`],
            ["fill", Colour.LightBlue.toString()],
            ["x", `${cell.j * CELL_SIZE}`],
            ["y", `${cell.i * CELL_SIZE}`]);

        this.highlightSvg.appendChild(rect);
    }

    override handleMouseMove(_event: MouseEvent) {
        // console.log(`move: ${event.offsetX},${event.offsetY}`);
    }

    override handleKeyDown(event: KeyboardEvent) {
        if (this.focusedCell) {
            switch(event.key) {
            case "1": case "2": case "3":
            case "4": case "5": case "6":
            case "7": case "8": case "9":
                {
                    let digit = Digit.parse(event.key);
                    let previousDigit = this.puzzleGrid.getDigitAtCell(this.focusedCell);
                    if (digit != previousDigit) {
                        let action = new WriteDigitAction(this.puzzleGrid, this.focusedCell, digit, previousDigit);
                        this.actionStack.doAction(action);
                    }
                }
                break
            default:
                break;
            }
        }
    }
}
