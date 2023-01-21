class PanTool extends ITool {

    constructor(toolBox: ToolBox, puzzleGrid: PuzzleGrid, actionStack: UndoRedoStack, sceneManager: SceneManager) {
        super(toolBox, puzzleGrid, actionStack, sceneManager);
    }

    get mode(): ToolMode {
        return ToolMode.ConstraintEdit;
    }

    override handlePickUp(_prevTool: ITool): void {
        this.sceneManager.setMouseCursor(Cursor.Grab);
    }

    override handlePutDown(_nextTool: ITool): void {
        this.sceneManager.setMouseCursor(Cursor.Default);
    }

    override handleMouseDown(event: MouseEvent): boolean {
        if (event.primaryButton) {
            this.sceneManager.setMouseCursor(Cursor.Grabbing);
            return true;
        }
        return false;
    }

    override handleMouseMove(event: MouseEvent): boolean {
        if (event.primaryButton) {
            this.sceneManager.translateViewport(-event.movementX, -event.movementY);
            return true;
        }
        return false;
    }

    override handleMouseUp(event: MouseEvent): boolean {
        if (!event.primaryButton) {
            this.sceneManager.setMouseCursor(Cursor.Grab);
            return true;
        }
        return false;
    }
}