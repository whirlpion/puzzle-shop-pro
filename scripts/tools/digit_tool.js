"use strict";
class WriteDigitAction extends IAction {
    apply() {
        this.puzzleGrid.setDigitAtCell(this.cell, this.digit);
    }
    revert() {
        this.puzzleGrid.setDigitAtCell(this.cell, this.previousDigit);
    }
    constructor(puzzleGrid, cell, digit, previousDigit) {
        super(`write ${digit} digit to ${cell}`);
        this.previousDigit = null;
        this.puzzleGrid = puzzleGrid;
        this.cell = cell;
        this.digit = digit;
        this.previousDigit = previousDigit;
    }
}
class DigitTool extends ITool {
    constructor(puzzleGrid, actionStack, sceneManager) {
        super(puzzleGrid, actionStack, sceneManager);
        // the cells which are currently highlighted
        this.highlights = new BSTSet();
        // the cell that has focus
        this.focusedCell = null;
        let svg = this.sceneManager.createElement("g", SVGGElement, RenderLayer.Fill);
        this.highlightSvg = svg;
        this.puzzleGrid = puzzleGrid;
    }
    handleMouseClick(event) {
        let cell = Cell.fromXY(event.offsetX, event.offsetY);
        this.focusedCell = cell;
        this.highlightSvg.clearChildren();
        let rect = this.sceneManager.createElement("rect", SVGRectElement);
        rect.setAttributes(["width", `${CELL_SIZE}`], ["height", `${CELL_SIZE}`], ["fill", Colour.LightBlue.toString()], ["x", `${cell.j * CELL_SIZE}`], ["y", `${cell.i * CELL_SIZE}`]);
        this.highlightSvg.appendChild(rect);
    }
    handleMouseMove(_event) {
        // console.log(`move: ${event.offsetX},${event.offsetY}`);
    }
    handleKeyDown(event) {
        if (this.focusedCell) {
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
                    {
                        let digit = Digit.parse(event.key);
                        let previousDigit = this.puzzleGrid.getDigitAtCell(this.focusedCell);
                        if (digit != previousDigit) {
                            let action = new WriteDigitAction(this.puzzleGrid, this.focusedCell, digit, previousDigit);
                            this.actionStack.doAction(action);
                        }
                    }
                    break;
                default:
                    break;
            }
        }
    }
}
