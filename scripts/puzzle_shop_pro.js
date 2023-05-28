"use strict";
// this is the root object that everything goes through
class PuzzleShopPro {
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
let psp = null;
function start_puzzle_shop_pro() {
    psp = new PuzzleShopPro();
}
