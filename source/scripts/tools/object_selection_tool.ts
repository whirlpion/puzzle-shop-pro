class ObjectSelectionTool extends ITool {

    constructor(toolBox: ToolBox, puzzleGrid: PuzzleGrid, actionStack: UndoRedoStack, sceneManager: SceneManager) {
        super(toolBox, puzzleGrid, actionStack, sceneManager);
    }

    override handleMouseClick(event: MouseEvent): boolean {
        let cell = this.sceneManager.cellAtMouseEvent(event);

        // get all the constraints at this cell
        let constraints = this.puzzleGrid.getConstraintsAtCell(cell);

        if (event.shortcutKey) {
            // we need to determine if we are adding or removing constraints
            // if any of the constraings at the cell are alreayd in our set,
            // then remove them
            let addAll: boolean = true;
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

        } else if (event.shiftKey) {
            // add all clicked
            for (let constraint of constraints) {
                this.puzzleGrid.selectConstraint(constraint);
            }
        } else {
            // replace selection with current
            this.puzzleGrid.clearSelectedConstraints();
            for (let constraint of constraints) {
                this.puzzleGrid.selectConstraint(constraint);
            }
        }

        this.puzzleGrid.updateSelectionBox();

        return true;
    }
}