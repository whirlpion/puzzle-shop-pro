"use strict";
var Tool;
(function (Tool) {
    Tool[Tool["ObjectSelection"] = 0] = "ObjectSelection";
    Tool[Tool["RectangleSelection"] = 1] = "RectangleSelection";
    Tool[Tool["GridInsertion"] = 2] = "GridInsertion";
})(Tool || (Tool = {}));
class ITool {
    constructor(puzzleGrid, actionStack, sceneManager) {
        this.puzzleGrid = puzzleGrid;
        this.actionStack = actionStack;
        this.sceneManager = sceneManager;
    }
    // when user switches to this tool
    handlePickUp(_prevTool) { }
    // when user switches to another tool
    handlePutDown(_nextTool) { }
    // when the canvas receives click event with this tool
    handleMouseClick(_event) { return false; }
    // when the canvas receives dblclick event with this tool
    handleMouseDoubleClick(_event) { return false; }
    // when the canvas recevies mousedown event with this tool
    handleMouseDown(_event) { return false; }
    // when the canvas receives mouseup event with this tool
    handleMouseUp(_event) { return false; }
    // when the canvas receives mousemove event with this tool
    handleMouseMove(_event) { return false; }
    // when the canvas receives keydown event with this tool
    handleKeyDown(_event) { return false; }
    // when the canvas receives keyup event with this tool
    handleKeyUp(_event) { return false; }
}
class NoOpTool extends ITool {
    constructor(puzzleGrid, actionStack, sceneManager) {
        super(puzzleGrid, actionStack, sceneManager);
    }
}
class ToolBox {
    switchToTool(tool) {
        if (tool == this.currentTool) {
            return;
        }
        const prevTool = this.currentTool;
        const nextTool = tool;
        this.currentTool.handlePutDown(nextTool);
        this.currentTool = tool;
        this.currentTool.handlePickUp(prevTool);
        console.debug(`Switching to ${tool.constructor.name}`);
    }
    constructor(puzzleGrid, actionStack, sceneManager) {
        this.tools = new Array();
        this.puzzleGrid = puzzleGrid;
        this.actionStack = actionStack;
        this.sceneManager = sceneManager;
        this.currentTool = new NoOpTool(puzzleGrid, actionStack, sceneManager);
        const blueprints = [
            ["object_selection_tool", ObjectSelectionTool, "KeyO"],
            ["rectangle_selection_tool", NoOpTool, undefined],
            ["grid_tool", GridTool, "KeyG"],
            ["digit_tool", DigitTool, "KeyZ"],
            ["center_tool", CenterTool, "KeyC"],
            ["corner_tool", CornerTool, "KeyX"],
        ];
        for (let [id, toolConstructor, _code] of blueprints) {
            let tool = new toolConstructor(puzzleGrid, actionStack, sceneManager);
            this.tools.push(tool);
            let button = document.querySelector(`div#${id}`);
            throwIfNull(button);
            button.addEventListener("click", () => {
                this.switchToTool(tool);
            });
        }
        // always start with the object selection tool
        this.currentTool = this.tools[Tool.ObjectSelection];
        // register input events on the root svg element to forward to the tools
        let svg = document.querySelector("svg#canvas_root");
        throwIfNull(svg);
        svg.addEventListener("click", (event) => {
            if (this.currentTool.handleMouseClick(event)) {
                event.preventDefault();
                event.stopPropagation();
            }
        });
        svg.addEventListener("dblclick", (event) => {
            if (this.currentTool.handleMouseDoubleClick(event)) {
                event.preventDefault();
                event.stopPropagation();
            }
        });
        svg.addEventListener("mousedown", (event) => {
            if (this.currentTool.handleMouseDown(event)) {
                event.preventDefault();
                event.stopPropagation();
            }
        });
        svg.addEventListener("mouseup", (event) => {
            if (this.currentTool.handleMouseUp(event)) {
                event.preventDefault();
                event.stopPropagation();
            }
        });
        svg.addEventListener("mousemove", (event) => {
            if (this.currentTool.handleMouseMove(event)) {
                event.preventDefault();
                event.stopPropagation();
            }
        });
        svg.addEventListener("wheel", (event) => {
            if (this.sceneManager.handleWheel(event)) {
                event.preventDefault();
                event.stopPropagation();
            }
        });
        document.addEventListener("keydown", (event) => {
            // check for tool switching
            let keyboardEvent = event;
            if (!keyboardEvent.shiftKey &&
                !keyboardEvent.metaKey &&
                !keyboardEvent.ctrlKey &&
                !keyboardEvent.altKey) {
                for (let k = 0; k < blueprints.length; k++) {
                    let [_id, _toolConstructor, code] = blueprints[k];
                    if (code && keyboardEvent.code === code) {
                        this.switchToTool(this.tools[k]);
                        event.preventDefault();
                        event.stopPropagation();
                        return;
                    }
                }
            }
            // check for undo/redo
            if (keyboardEvent.shortcutKey && keyboardEvent.code === "KeyZ") {
                if (!keyboardEvent.shiftKey) {
                    this.actionStack.undo();
                }
                else {
                    this.actionStack.redo();
                }
                event.preventDefault();
                event.stopPropagation();
                return;
            }
            // propagate to tools
            if (this.currentTool.handleKeyDown(keyboardEvent)) {
                event.preventDefault();
                event.stopPropagation();
            }
        }, { capture: true });
        document.addEventListener("keyup", (event) => {
            if (this.currentTool.handleKeyUp(event)) {
                event.preventDefault();
                event.stopPropagation();
            }
        }, { capture: true });
    }
}
