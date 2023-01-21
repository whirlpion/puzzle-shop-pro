class MoveTool extends ITool {

    private origin: Cell | null = null;

    constructor(toolBox: ToolBox, puzzleGrid: PuzzleGrid, actionStack: UndoRedoStack, sceneManager: SceneManager) {
        super(toolBox, puzzleGrid, actionStack, sceneManager)
    }

    get mode(): ToolMode {
        return ToolMode.ConstraintEdit;
    }

    override handleMouseDown(event: MouseEvent): boolean {
        if (event.primaryButton) {
            const cell = this.sceneManager.cellAtMouseEvent(event);
            if (this.puzzleGrid.selectionBoundingBox.cellInBox(cell)) {
                this.origin = cell;
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
            return true;
        }
        return false;
    }
}