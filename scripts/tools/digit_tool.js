"use strict";
class WriteDigitAction extends IAction {
    apply() {
        for (let cell of this.cells) {
            this.puzzleGrid.setDigitAtCell(cell, this.digit);
        }
    }
    revert() {
        for (let k = 0; k < this.cells.length; k++) {
            this.puzzleGrid.setDigitAtCell(this.cells[k], this.previousDigits[k]);
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
var Direction;
(function (Direction) {
    Direction[Direction["Up"] = 0] = "Up";
    Direction[Direction["Right"] = 1] = "Right";
    Direction[Direction["Down"] = 2] = "Down";
    Direction[Direction["Left"] = 3] = "Left";
})(Direction || (Direction = {}));
class DigitTool extends ITool {
    constructor(puzzleGrid, actionStack, sceneManager) {
        super(puzzleGrid, actionStack, sceneManager);
        // the cells which are currently highlighted mapped to their associated SVG Rect
        this.highlightedCells = new BSTMap();
        // the cell that has focus
        this.focusedCell = null;
        let svg = this.sceneManager.createElement("g", SVGGElement, RenderLayer.Fill);
        this.highlightSvg = svg;
        this.puzzleGrid = puzzleGrid;
    }
    // create a highlight rect
    createHighlightRect(cell) {
        let rect = this.sceneManager.createElement("rect", SVGRectElement);
        rect.setAttributes(["width", `${CELL_SIZE}`], ["height", `${CELL_SIZE}`], ["fill", Colour.LightBlue.toString()], ["x", `${cell.j * CELL_SIZE}`], ["y", `${cell.i * CELL_SIZE}`]);
        return rect;
    }
    clearAllHighlights() {
        this.highlightedCells.clear();
        this.highlightSvg.clearChildren();
        this.focusedCell = null;
    }
    highlightCells(setFocus, ...cells) {
        for (let cell of cells) {
            if (this.highlightedCells.has(cell)) {
                continue;
            }
            let rect = this.createHighlightRect(cell);
            this.highlightedCells.set(cell, rect);
            this.highlightSvg.appendChild(rect);
        }
        if (setFocus && cells.length > 0) {
            this.focusedCell = cells.last();
        }
    }
    toggleCell(cell) {
        // cell toggle
        let rect = this.highlightedCells.get(cell);
        if (rect) {
            this.highlightedCells.delete(cell);
            this.highlightSvg.removeChild(rect);
            // no focused cell after this point
            this.focusedCell = null;
        }
        else {
            rect = this.createHighlightRect(cell);
            this.highlightedCells.set(cell, rect);
            this.highlightSvg.appendChild(rect);
            // focus the cell
            this.focusedCell = cell;
        }
    }
    // writes a digit to the highlighted cells
    writeDigit(digit) {
        // first make sure the key press would result in anything changing
        let actionIsNoop = true;
        let cells = Array.collect(this.highlightedCells.keys());
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
    moveFocus(direction, clearHighlight) {
        console.log("moving focus?");
        throwIfNull(this.focusedCell);
        let newFocus = null;
        switch (direction) {
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
        if (clearHighlight) {
            this.clearAllHighlights();
        }
        if (newFocus) {
            this.highlightCells(true, newFocus);
        }
    }
    handlePutDown() {
        // no cells selected
        this.highlightedCells = new BSTMap();
        this.highlightSvg.clearChildren();
        this.focusedCell = null;
    }
    handleMouseDoubleClick(event) {
        const cell = Cell.fromMouseEvent(event);
        const digit = this.puzzleGrid.getDigitAtCell(cell);
        if (digit) {
            const matchingCells = this.puzzleGrid.getCellsWithDigit(digit);
            this.clearAllHighlights();
            this.highlightCells(false, ...matchingCells);
            this.focusedCell = cell;
        }
        else {
            this.clearAllHighlights();
            this.highlightCells(true, cell);
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
            this.toggleCell(cell);
        }
        else if (event.shiftKey && this.focusedCell) {
            // cell line
            const line = Cell.bresenhamLine(this.focusedCell, cell);
            this.highlightCells(true, ...line);
        }
        else {
            // this block is here so that double click events work as expected, we need to
            // make the highlight rect which would be the target of the first click
            // persist in the DOM so it can receive a seconnd click
            let clickRect = this.highlightedCells.get(cell);
            if (clickRect) {
                for (let [_cell, rect] of this.highlightedCells) {
                    if (rect !== clickRect) {
                        this.highlightSvg.removeChild(rect);
                    }
                }
                this.highlightedCells.clear();
                this.highlightCells(true, cell);
            }
            else {
                this.highlightSvg.clearChildren();
                this.highlightedCells.clear();
                this.highlightCells(true, cell);
            }
        }
    }
    handleMouseUp(_event) {
        // console.log(`mouseup: ${event.offsetX},${event.offsetY}`);
    }
    handleMouseMove(event) {
        // only care about click and drag
        if (!event.primaryButton || !this.focusedCell) {
            return;
        }
        const cell = Cell.fromMouseEvent(event);
        const line = Cell.bresenhamLine(this.focusedCell, cell);
        this.highlightCells(true, ...line);
    }
    handleKeyDown(event) {
        console.log(`code: ${event.code} key: ${event.key}`);
        if (this.highlightedCells.size > 0) {
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
                    this.moveFocus(Direction.Up, !event.shiftKey);
                    break;
                case "ArrowRight":
                    this.moveFocus(Direction.Right, !event.shiftKey);
                    break;
                case "ArrowDown":
                    this.moveFocus(Direction.Down, !event.shiftKey);
                    break;
                case "ArrowLeft":
                    this.moveFocus(Direction.Left, !event.shiftKey);
                    break;
                default:
                    console.log(`unhandled key press: ${event.key}`);
                    return;
            }
            event.preventDefault();
        }
    }
}