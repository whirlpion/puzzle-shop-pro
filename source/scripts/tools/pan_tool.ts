class PanTool extends ITool {
    prevTool: ITool | null = null;

    constructor(toolBox: ToolBox, puzzleGrid: PuzzleGrid, actionStack: UndoRedoStack, sceneManager: SceneManager) {
        super(toolBox, puzzleGrid, actionStack, sceneManager);
    }

    override handlePickUp(prevTool: ITool, switchMethod: SwitchMethod): void {
        if (switchMethod === SwitchMethod.Keyboard) {
            this.prevTool = prevTool;
        } else {
            this.prevTool = null;
        }
        this.sceneManager.setMouseCursor(Cursor.Grab);
    }

    override handlePutDown(_nextTool: ITool): void {
        this.sceneManager.setMouseCursor(Cursor.Default);
    }

    override handleKeyUp(event: KeyboardEvent): boolean {
        if (this.prevTool && event.code === "Space") {
            const prevTool = this.prevTool;
            this.prevTool = null;
            this.toolBox.switchToTool(prevTool, SwitchMethod.Keyboard);
            return true;
        }
        return false;
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