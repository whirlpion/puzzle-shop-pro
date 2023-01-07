class InsertGridAction extends IAction {
    override apply(): void {
        // register the constrained cells
        for (let constraint of this.gridConstraint.regionConstraints) {
            this.puzzleGrid.addConstraint(constraint);
        }
        // check for constraint violations
        this.puzzleGrid.checkCellsForConstraintViolations(...this.gridConstraint.cells);
        // add the svg
        this.sceneManager.addElement(this.gridConstraint.svg, RenderLayer.Grid);
    }
    override revert(): void {
        // remove the constrained cells
        for (let constraint of this.gridConstraint.regionConstraints) {
            this.puzzleGrid.removeConstraint(constraint);
        }
        // check for constraint violations
        this.puzzleGrid.checkCellsForConstraintViolations(...this.gridConstraint.cells);
        // remove the svg
        this.sceneManager.removeElement(this.gridConstraint.svg);
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
    constructor(puzzleGrid: PuzzleGrid, actionStack: UndoRedoStack, sceneManager: SceneManager) {
        super(puzzleGrid, actionStack, sceneManager);
    }

    //
    // ITool interface
    //

    // when the canvas receives click event with this tool
    override handleMouseClick(event: MouseEvent): boolean {
        this.insertGrid(Cell.fromXY(event.offsetX, event.offsetY));
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