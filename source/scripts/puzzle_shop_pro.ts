// this is the root object that everything goes through
class PuzzleShopPro {
    public readonly puzzleGrid: PuzzleGrid;
    public readonly sceneManager: SceneManager;
    public readonly actionStack: UndoRedoStack;
    public readonly toolBox: ToolBox;

    constructor() {
        let parent = document.querySelector("div#puzzle_canvas");
        throwIfNull(parent);
        let svg = <SVGSVGElement>document.createElementNS(SVG_NAMESPACE, "svg");
        svg.setAttribute("id", "canvas_root");
        svg.setAttribute("width", `${DEFAULT_GRID_SIZE * CELL_SIZE}`);
        svg.setAttribute("height", `${DEFAULT_GRID_SIZE * CELL_SIZE}`);
        svg.setAttribute("focusable", "true");
        parent.appendChild(svg);
        this.sceneManager = new SceneManager(svg);

        this.actionStack = new UndoRedoStack();
        this.puzzleGrid = new PuzzleGrid(this.sceneManager, DEFAULT_GRID_SIZE, DEFAULT_GRID_SIZE);
        this.toolBox = new ToolBox(this.puzzleGrid, this.actionStack, this.sceneManager);
    }
}

let psp: PuzzleShopPro | null = null;
function start_puzzle_shop_pro(): void {
    psp = new PuzzleShopPro();
}