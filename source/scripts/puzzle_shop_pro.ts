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

        this.puzzleGrid = new PuzzleGrid(this.sceneManager);
        this.toolBox = new ToolBox(this.puzzleGrid, this.actionStack, this.sceneManager);

        let constraintListPanelRoot = document.querySelector("div#constraint_list_panel");
        throwIfNull(constraintListPanelRoot);
        throwIfNotType(constraintListPanelRoot, HTMLDivElement);
        this.constraintListPanel = new ConstraintListPanel(constraintListPanelRoot, this.puzzleGrid, this.actionStack, this.toolBox);
    }
}

let psp: PuzzleShopPro | null = null;
function start_puzzle_shop_pro(): void {
    psp = new PuzzleShopPro();
}
