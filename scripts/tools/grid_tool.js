"use strict";
class InsertGridAction extends IAction {
    apply() {
        // register the constrained cells
        for (let constraint of this.gridConstraint.regionConstraints) {
            for (let cell of constraint.cells) {
                this.puzzleGrid.addConstraintToCell(cell, constraint);
            }
        }
        // add the svg
        this.sceneManager.addElement(this.gridConstraint.svg, RenderLayer.Grid);
    }
    revert() {
        // remove the constrained cells
        for (let constraint of this.gridConstraint.regionConstraints) {
            for (let cell of constraint.cells) {
                this.puzzleGrid.removeConstraintFromCell(cell, constraint);
            }
        }
        // remove the svg
        this.sceneManager.removeElement(this.gridConstraint.svg);
    }
    constructor(puzzleGrid, sceneManager, cell) {
        super(`insert 9x9 grid at ${cell}`);
        this.puzzleGrid = puzzleGrid;
        this.sceneManager = sceneManager;
        this.gridConstraint = new Grid9x9Constraint(sceneManager, cell);
    }
}
class GridTool extends ITool {
    constructor(puzzleGrid, actionStack, sceneManager) {
        super(puzzleGrid, actionStack, sceneManager);
    }
    //
    // ITool interface
    //
    // when the canvas receives click event with this tool
    handleMouseClick(event) {
        this.insertGrid(Cell.fromXY(event.offsetX, event.offsetY));
    }
    //
    // Private methods
    //
    insertGrid(cell) {
        let action = new InsertGridAction(this.puzzleGrid, this.sceneManager, cell);
        this.actionStack.doAction(action);
    }
}
