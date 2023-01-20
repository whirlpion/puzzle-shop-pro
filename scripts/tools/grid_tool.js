"use strict";
class InsertGridAction extends IAction {
    apply() {
        // register the constrained cells
        this.puzzleGrid.addConstraint(this.gridConstraint);
        // check for constraint violations
        this.puzzleGrid.checkCellsForConstraintViolations(...this.gridConstraint.cells);
        // add the svg
        this.sceneManager.addElement(this.gridConstraint.svg, RenderLayer.Grid);
        // update the selection box
        this.puzzleGrid.updateSelectionBox();
    }
    revert() {
        // remove the constrained cells
        this.puzzleGrid.removeConstraint(this.gridConstraint);
        // check for constraint violations
        this.puzzleGrid.checkCellsForConstraintViolations(...this.gridConstraint.cells);
        // remove the svg
        this.sceneManager.removeElement(this.gridConstraint.svg);
        // update the selection box
        this.puzzleGrid.updateSelectionBox();
    }
    constructor(puzzleGrid, sceneManager, cell) {
        super(`insert 9x9 grid at ${cell}`);
        this.puzzleGrid = puzzleGrid;
        this.sceneManager = sceneManager;
        this.gridConstraint = new Grid9x9Constraint(sceneManager, cell);
    }
}
class GridTool extends ITool {
    constructor(toolBox, puzzleGrid, actionStack, sceneManager) {
        super(toolBox, puzzleGrid, actionStack, sceneManager);
    }
    //
    // ITool interface
    //
    // when the canvas receives click event with this tool
    handleMouseClick(event) {
        const cell = this.sceneManager.cellAtMouseEvent(event);
        this.insertGrid(cell);
        return true;
    }
    //
    // Private methods
    //
    insertGrid(cell) {
        let action = new InsertGridAction(this.puzzleGrid, this.sceneManager, cell);
        this.actionStack.doAction(action);
    }
}
