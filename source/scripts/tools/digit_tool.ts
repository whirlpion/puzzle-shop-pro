class WriteDigitAction extends IAction {
    override apply(): void {
        for (let cell of this.cells) {
            this.puzzleGrid.setDigitAtCell(cell, this.digit);
        }
    }
    override revert(): void {
        for(let k = 0; k < this.cells.length; k++) {
            this.puzzleGrid.setDigitAtCell(this.cells[k], this.previousDigits[k]);
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

enum Direction {
    Up,
    Right,
    Down,
    Left,
}

class DigitTool extends ITool {
    // the cells which are currently highlighted mapped to their associated SVG Rect
    highlightedCells: BSTMap<Cell, SVGRectElement> = new BSTMap();
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

    // create a highlight rect
    private createHighlightRect(cell: Cell): SVGRectElement {
        let rect = this.sceneManager.createElement("rect", SVGRectElement);
        rect.setAttributes(
            ["width", `${CELL_SIZE}`],
            ["height", `${CELL_SIZE}`],
            ["fill", Colour.LightBlue.toString()],
            ["x", `${cell.j * CELL_SIZE}`],
            ["y", `${cell.i * CELL_SIZE}`]);
        return rect;
    }

    // writes a digit to the highlighted cells
    private writeDigit(digit: Digit | null): void {
        // first make sure the key press would result in anything changing
        let actionIsNoop = true;
        let cells = Array.collect(this.highlightedCells.keys());
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

    // highlights a line of cells
    private highlightLine(from: Cell, to: Cell): void {
        // cell line
        let line = Cell.bresenhamLine(from, to);
        for (let cell of line) {
            let rect = this.highlightedCells.get(cell);
            if (!rect) {
                rect = this.createHighlightRect(cell)
                this.highlightedCells.set(cell, rect);
                this.highlightSvg.appendChild(rect);
            }
        }
        this.focusedCell = to;
    }

    private moveFocus(direction: Direction): void {
        throwIfNull(this.focusedCell);
        let newFocus: Cell | null = null;
        switch(direction) {
        case Direction.Up:
            if (this.focusedCell.i - 1 >= 0) {
                newFocus = new Cell(this.focusedCell.i - 1, this.focusedCell.j);
            }
            break;
        case Direction.Right:
            if (this.focusedCell.j + 1 < this.puzzleGrid.columns) {
                newFocus = new Cell(this.focusedCell.i, this.focusedCell.j + 1);
            }
            break;
        case Direction.Down:
            if (this.focusedCell.i + 1 < this.puzzleGrid.rows) {
                newFocus = new Cell(this.focusedCell.i + 1, this.focusedCell.j);
            }
            break;
        case Direction.Left:
            if (this.focusedCell.j - 1 >= 0) {
                newFocus = new Cell(this.focusedCell.i, this.focusedCell.j - 1);
            }
            break;
        default:
            throwMessage(`Unexpected Direction: ${direction}`);
            break;
        }

        if (newFocus) {
            this.highlightedCells.clear();
            this.highlightSvg.clearChildren();

            const rect = this.createHighlightRect(newFocus);
            this.highlightedCells.set(newFocus, rect);
            this.highlightSvg.appendChild(rect);
            // focus the cell
            this.focusedCell = newFocus;
        }
    }

    override handlePutDown() {
        // no cells selected
        this.highlightedCells = new BSTMap();
        this.highlightSvg.clearChildren();
        this.focusedCell = null;
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
            // cell toggle
            let rect = this.highlightedCells.get(cell);
            if (rect) {
                this.highlightedCells.delete(cell);
                this.highlightSvg.removeChild(rect);
                // no focused cell after this point
                this.focusedCell = null;
            } else {
                rect = this.createHighlightRect(cell);
                this.highlightedCells.set(cell, rect);
                this.highlightSvg.appendChild(rect);
                // focus the cell
                this.focusedCell = cell;
            }
        } else if (event.shiftKey && this.focusedCell) {
            // cell line
            this.highlightLine(this.focusedCell, cell);
        } else {
            // set only the cell
            this.highlightedCells.clear();
            this.highlightSvg.clearChildren();

            const rect = this.createHighlightRect(cell);
            this.highlightedCells.set(cell, rect);
            this.highlightSvg.appendChild(rect);
            // focus the cell
            this.focusedCell = cell;
        }
    }

    override handleMouseUp(_event: MouseEvent) {
        // console.log(`mouseup: ${event.offsetX},${event.offsetY}`);
    }

    override handleMouseMove(event: MouseEvent) {
        // only care about click and drag
        if (!event.primaryButton || !this.focusedCell) {
            return;
        }

        const cell = Cell.fromMouseEvent(event);
        this.highlightLine(this.focusedCell, cell);
    }

    override handleKeyDown(event: KeyboardEvent) {
        console.log(`code: ${event.code} key: ${event.key}`);
        if (this.highlightedCells.size > 0) {
            switch(event.key) {
            case "1": case "2": case "3":
            case "4": case "5": case "6":
            case "7": case "8": case "9":
                event.preventDefault();
                this.writeDigit(Digit.parse(event.key));
                return;
            default:
                break;
            }
            if (this.focusedCell) {
                switch(event.code) {
                case "Backspace":
                case "Delete":
                    event.preventDefault();
                    this.writeDigit(null);
                    return;
                case "ArrowUp":
                    this.moveFocus(Direction.Up);
                    event.preventDefault();
                    break;
                case "ArrowRight":
                    this.moveFocus(Direction.Right);
                    event.preventDefault();
                    break;
                case "ArrowDown":
                    this.moveFocus(Direction.Down);
                    event.preventDefault();
                    break;
                case "ArrowLeft":
                    this.moveFocus(Direction.Left);
                    event.preventDefault();
                    break;
                default:
                    break;
                }
            }
        }
    }
}
