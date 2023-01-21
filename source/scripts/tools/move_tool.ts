class MoveTool extends ITool {
    constructor(toolBox: ToolBox, puzzleGrid: PuzzleGrid, actionStack: UndoRedoStack, sceneManager: SceneManager) {
        super(toolBox, puzzleGrid, actionStack, sceneManager)
    }

    get mode(): ToolMode {
        return ToolMode.ConstraintEdit;
    }
}