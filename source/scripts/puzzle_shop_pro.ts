// this is the root object that everything goes through
class PuzzleShopPro {
    public readonly puzzleGrid: PuzzleGrid;
    public readonly sceneManager: SceneManager;
    public readonly actionStack: UndoRedoStack;
    public readonly toolBox: ToolBox;
    public readonly constraintListPanel: ConstraintListPanel;

    constructor() {
        let parent = document.querySelector("div#puzzle_canvas");
        throwIfNull(parent);
        throwIfNotType(parent, HTMLElement);

        this.sceneManager = new SceneManager(parent);
        this.actionStack = new UndoRedoStack();
        let constraintListPanel = document.querySelector("div#constraint_list_panel");
        throwIfNull(constraintListPanel);
        throwIfNotType(constraintListPanel, HTMLDivElement);

        this.constraintListPanel = new ConstraintListPanel(constraintListPanel);
        this.puzzleGrid = new PuzzleGrid(this.sceneManager, this.constraintListPanel, DEFAULT_GRID_SIZE, DEFAULT_GRID_SIZE);
        this.toolBox = new ToolBox(this.puzzleGrid, this.actionStack, this.sceneManager);
    }
}

let psp: PuzzleShopPro | null = null;
function start_puzzle_shop_pro(): void {
    psp = new PuzzleShopPro();
}