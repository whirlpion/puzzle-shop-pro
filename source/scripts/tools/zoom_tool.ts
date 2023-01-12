class ZoomTool extends ITool {

    private readonly ZOOM_FACTOR: number = Math.pow(2.0, 1/4);

    constructor(toolBox: ToolBox, puzzleGrid: PuzzleGrid, actionStack: UndoRedoStack, sceneManager: SceneManager) {
        super(toolBox, puzzleGrid, actionStack, sceneManager);
    }

    override handleMouseClick(event: MouseEvent): boolean {
        const zoom = this.sceneManager.zoom;
        if (event.shortcutKey) {
            this.sceneManager.zoomViewport(zoom / this.ZOOM_FACTOR);
        } else {
            this.sceneManager.zoomViewport(zoom * this.ZOOM_FACTOR);
        }
        return true;
    }
}