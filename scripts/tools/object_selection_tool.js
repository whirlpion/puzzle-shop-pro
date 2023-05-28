"use strict";
class DeleteConstraintsAction extends IAction {
    apply() {
        for (let constraint of this.constraints) {
            this.puzzleGrid.removeConstraint(constraint);
            constraint.svg.parentElement?.removeChild(constraint.svg);
        }
        this.puzzleGrid.updateSelectionBox();
        this.puzzleGrid.checkCellsForConstraintViolations(...this.affectedCells);
    }
    revert() {
        throwIfNotEqual(this.constraints.length, this.svgParents.length);
        const length = this.constraints.length;
        for (let k = 0; k < length; k++) {
            const constraint = this.constraints[k];
            this.puzzleGrid.addConstraint(constraint);
            this.svgParents[k].appendChild(constraint.svg);
        }
        this.puzzleGrid.updateSelectionBox();
        this.puzzleGrid.checkCellsForConstraintViolations(...this.affectedCells);
    }
    constructor(puzzleGrid, affectedCells, constraints) {
        super(`deleting constraints: ${constraints.map(c => c.name).join(", ")}`);
        this.puzzleGrid = puzzleGrid;
        this.affectedCells = affectedCells;
        this.constraints = constraints;
        this.svgParents = constraints.map((constraint) => constraint.svg.parentElement);
    }
}
class ObjectSelectionTool extends ITool {
    constructor(toolBox, puzzleGrid, actionStack, sceneManager) {
        super(toolBox, puzzleGrid, actionStack, sceneManager);
    }
    get mode() {
        return ToolMode.ConstraintEdit;
    }
    handleMouseClick(event) {
        let cell = this.sceneManager.cellAtMouseEvent(event);
        // get all the constraints at this cell
        let constraints = this.puzzleGrid.getConstraintsAtCell(cell);
        if (event.shortcutKey) {
            // we need to determine if we are adding or removing constraints
            // if any of the constraings at the cell are alreayd in our set,
            // then remove them
            let addAll = true;
            for (let constraint of constraints) {
                if (this.puzzleGrid.isConstraintSelected(constraint)) {
                    addAll = false;
                    this.puzzleGrid.unselectConstraint(constraint);
                }
            }
            // otherwise add them all
            if (addAll) {
                for (let constraint of constraints) {
                    this.puzzleGrid.selectConstraint(constraint);
                }
            }
        }
        else if (event.shiftKey) {
            // add all clicked
            for (let constraint of constraints) {
                this.puzzleGrid.selectConstraint(constraint);
            }
        }
        else {
            // replace selection with current
            this.puzzleGrid.clearSelectedConstraints();
            for (let constraint of constraints) {
                this.puzzleGrid.selectConstraint(constraint);
            }
        }
        this.puzzleGrid.updateSelectionBox();
        return true;
    }
    handleKeyDown(event) {
        if (this.puzzleGrid.hasSelectedConstraints) {
            switch (event.key) {
                case "Backspace":
                case "Delete":
                    {
                        let affectedCells = new BSTSet();
                        let constraints = this.puzzleGrid.getSelectedConstraints();
                        for (let constraint of constraints) {
                            affectedCells.add(...constraint.cells);
                        }
                        const action = new DeleteConstraintsAction(this.puzzleGrid, [...affectedCells], constraints);
                        this.actionStack.doAction(action);
                    }
                    return true;
            }
        }
        return false;
    }
}
