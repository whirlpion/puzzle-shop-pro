"use strict";
class MoveConstraintAction extends IAction {
    apply() {
        this.puzzleGrid.translateSelectedConstraints(this.rows, this.columns);
    }
    revert() {
        this.puzzleGrid.translateSelectedConstraints(-this.rows, -this.columns);
    }
    constructor(puzzleGrid, rows, columns, ...constraints) {
        throwIfFalse(Number.isInteger(rows));
        throwIfFalse(Number.isInteger(columns));
        super(`move constraints ${rows} rows, ${columns} columns`);
        this.puzzleGrid = puzzleGrid;
        this.rows = rows;
        this.columns = columns;
        this.constraints = constraints;
    }
}
class MoveTool extends ITool {
    constructor(toolBox, puzzleGrid, actionStack, sceneManager) {
        super(toolBox, puzzleGrid, actionStack, sceneManager);
        // cumulative constraint movement
        this.rows = 0;
        this.columns = 0;
        this.origin = null;
    }
    get mode() {
        return ToolMode.ConstraintEdit;
    }
    handlePutDown() {
        this.sceneManager.setMouseCursor(Cursor.Default);
    }
    handleMouseDown(event) {
        if (event.primaryButton) {
            const cell = this.sceneManager.cellAtMouseEvent(event);
            if (this.puzzleGrid.selectionBoundingBox.cellInBox(cell)) {
                this.origin = cell;
                this.rows = 0;
                this.columns = 0;
                console.log(`begin move from: ${this.origin}`);
                return true;
            }
        }
        return false;
    }
    handleMouseMove(event) {
        // update the mouse cursor
        const cell = this.sceneManager.cellAtMouseEvent(event);
        if (this.puzzleGrid.selectionBoundingBox.cellInBox(cell)) {
            this.sceneManager.setMouseCursor(Cursor.Move);
        }
        else {
            this.sceneManager.setMouseCursor(Cursor.Default);
        }
        if (this.origin && event.primaryButton) {
            let rows = cell.i - this.origin.i;
            let columns = cell.j - this.origin.j;
            // update cumulative movement
            this.rows += rows;
            this.columns += columns;
            this.puzzleGrid.translateSelectedConstraints(rows, columns);
            this.origin = cell;
            return true;
        }
        return false;
    }
    handleMouseUp(event) {
        if (this.origin && !event.primaryButton) {
            console.log(`end move to: ${this.origin}`);
            this.origin = null;
            if (this.rows !== 0 || this.columns !== 0) {
                let action = new MoveConstraintAction(this.puzzleGrid, this.rows, this.columns, ...this.puzzleGrid.getSelectedConstraints());
                // push action but don't apply it since already performed by
                // user action
                this.actionStack.pushAction(action, false);
            }
            return true;
        }
        return false;
    }
}
