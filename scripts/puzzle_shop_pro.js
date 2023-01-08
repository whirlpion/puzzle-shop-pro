"use strict";
// this is the root object that everything goes through
class PuzzleShopPro {
    constructor() {
        let parent = document.querySelector("div#puzzle_canvas");
        throwIfNull(parent);
        throwIfNotType(parent, HTMLElement);
        this.sceneManager = new SceneManager(parent);
        this.actionStack = new UndoRedoStack();
        this.puzzleGrid = new PuzzleGrid(this.sceneManager, DEFAULT_GRID_SIZE, DEFAULT_GRID_SIZE);
        this.toolBox = new ToolBox(this.puzzleGrid, this.actionStack, this.sceneManager);
    }
}
let psp = null;
function start_puzzle_shop_pro() {
    psp = new PuzzleShopPro();
}
