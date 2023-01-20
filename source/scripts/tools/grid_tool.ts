class InsertGridAction extends IAction {
    override apply(): void {
        // register the constrained cells
        this.puzzleGrid.addConstraint(this.gridConstraint);
        // check for constraint violations
        this.puzzleGrid.checkCellsForConstraintViolations(...this.gridConstraint.cells);
        // add the svg
        this.sceneManager.addElement(this.gridConstraint.svg, RenderLayer.Grid);
        // update the selection box
        this.puzzleGrid.updateSelectionBox();
    }
    override revert(): void {
        // remove the constrained cells
        this.puzzleGrid.removeConstraint(this.gridConstraint);
        // check for constraint violations
        this.puzzleGrid.checkCellsForConstraintViolations(...this.gridConstraint.cells);
        // remove the svg
        this.sceneManager.removeElement(this.gridConstraint.svg);
        // update the selection box
        this.puzzleGrid.updateSelectionBox();
    }

    puzzleGrid: PuzzleGrid;
    sceneManager: SceneManager;
    gridConstraint: Grid9x9Constraint;

    constructor(puzzleGrid: PuzzleGrid, sceneManager: SceneManager, cell: Cell) {
        super(`insert 9x9 grid at ${cell}`);
        this.puzzleGrid = puzzleGrid;
        this.sceneManager = sceneManager;
        this.gridConstraint = new Grid9x9Constraint(sceneManager, cell);
    }
}

class GridTool extends ITool {
    constructor(toolBox: ToolBox, puzzleGrid: PuzzleGrid, actionStack: UndoRedoStack, sceneManager: SceneManager) {
        super(toolBox, puzzleGrid, actionStack, sceneManager);
    }

    //
    // ITool interface
    //

    // when the canvas receives click event with this tool
    override handleMouseClick(event: MouseEvent): boolean {
        const cell = this.sceneManager.cellAtMouseEvent(event);
        this.insertGrid(cell);
        return true;
    }

    //
    // Private methods
    //

    private insertGrid(cell: Cell) {
        let action = new InsertGridAction(this.puzzleGrid, this.sceneManager, cell);
        this.actionStack.doAction(action);
    }
}