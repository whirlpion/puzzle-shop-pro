class DeleteConstraintsAction extends IAction {
    override apply(): void {
        for (let constraint of this.constraints) {
            this.puzzleGrid.removeConstraint(constraint);
            this.sceneManager.removeGraphic(constraint.graphic);
        }
        this.puzzleGrid.updateSelectionBox();
        this.puzzleGrid.checkCellsForConstraintViolations(...this.affectedCells);
    }

    override revert(): void {
        const length = this.constraints.length;
        for (let k = 0; k < length; k++) {
            const constraint = this.constraints[k];
            this.puzzleGrid.addConstraint(constraint);
            this.sceneManager.addGraphic(constraint.graphic);
        }
        this.puzzleGrid.updateSelectionBox();
        this.puzzleGrid.checkCellsForConstraintViolations(...this.affectedCells);
    }

    puzzleGrid: PuzzleGrid;
    sceneManager: SceneManager;
    affectedCells: Array<Cell>;
    constraints: Array<IConstraint>;

    constructor(puzzleGrid: PuzzleGrid, sceneManager: SceneManager, affectedCells: Array<Cell>, constraints: Array<IConstraint>) {
        super(`deleting constraints: ${constraints.map(c => c.name).join(", ")}`);
        this.puzzleGrid = puzzleGrid;
        this.sceneManager = sceneManager;
        this.affectedCells = affectedCells;
        this.constraints = constraints;
    }
}

class ObjectSelectionTool extends ITool {

    constructor(toolBox: ToolBox, puzzleGrid: PuzzleGrid, actionStack: UndoRedoStack, sceneManager: SceneManager) {
        super(toolBox, puzzleGrid, actionStack, sceneManager);
    }

    get mode(): ToolMode {
        return ToolMode.ConstraintEdit;
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

    override handleKeyDown(event: KeyboardEvent): boolean {
        if (this.puzzleGrid.hasSelectedConstraints) {
            switch (event.key) {
            case "Backspace": case "Delete":
                {
                    let affectedCells: BSTSet<Cell> = new BSTSet();
                    let constraints = this.puzzleGrid.getSelectedConstraints();
                    for(let constraint of constraints) {
                        affectedCells.add(...constraint.cells);
                    }

                    const action = new DeleteConstraintsAction(this.puzzleGrid, this.sceneManager, [...affectedCells], constraints);
                    this.actionStack.doAction(action);
                }
                return true;
            }
        }
        return false;
    }
}