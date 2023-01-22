class MoveConstraintAction extends IAction {
    override apply(): void {
        this.puzzleGrid.translateSelectedConstraints(this.rows, this.columns)
    }

    override revert(): void {
        this.puzzleGrid.translateSelectedConstraints(-this.rows, -this.columns)
    }

    puzzleGrid: PuzzleGrid;
    rows: number;
    columns: number;
    constraints: Array<IConstraint>;

    constructor(puzzleGrid: PuzzleGrid, rows: number, columns: number, ...constraints: IConstraint[]) {
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

    // cumulative constraint movement
    private rows: number = 0;
    private columns: number = 0;
    private origin: Cell | null = null;

    constructor(toolBox: ToolBox, puzzleGrid: PuzzleGrid, actionStack: UndoRedoStack, sceneManager: SceneManager) {
        super(toolBox, puzzleGrid, actionStack, sceneManager);
    }

    get mode(): ToolMode {
        return ToolMode.ConstraintEdit;
    }

    override handleMouseDown(event: MouseEvent): boolean {
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

    override handleMouseMove(event: MouseEvent): boolean {
        if (this.origin && event.primaryButton) {
            const cell = this.sceneManager.cellAtMouseEvent(event);

            let rows = cell.i - this.origin.i;
            let columns = cell.j - this.origin.j;

            // update cumulative movement
            this.rows += rows;
            this.columns += columns;

            this.puzzleGrid.translateSelectedConstraints(rows, columns)
            this.origin = cell;

            return true;
        }
        return false;
    }

    override handleMouseUp(event: MouseEvent): boolean {
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