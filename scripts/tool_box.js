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
    handlePickUp() { }
    // when user switches to another tool
    handlePutDown() { }
    // when the canvas receives click event with this tool
    handleMouseClick(_event) { }
    // when the canvas receives dblclick event with this tool
    handleMouseDoubleClick(_event) { }
    // when the canvas recevies mousedown event with this tool
    handleMouseDown(_event) { }
    // when the canvas receives mouseup event with this tool
    handleMouseUp(_event) { }
    // when the canvas receives mousemove event with this tool
    handleMouseMove(_event) { }
    // when the canvas receives keydown event with this tool
    handleKeyDown(_event) { }
    // when the canvas receives keyup event with this tool
    handleKeyUp(_event) { }
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
        this.currentTool.handlePutDown();
        this.currentTool = tool;
        this.currentTool.handlePickUp();
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
            this.currentTool.handleMouseClick(event);
        });
        svg.addEventListener("dblclick", (event) => {
            this.currentTool.handleMouseDoubleClick(event);
        });
        svg.addEventListener("mousedown", (event) => {
            this.currentTool.handleMouseDown(event);
        });
        svg.addEventListener("mouseup", (event) => {
            this.currentTool.handleMouseUp(event);
        });
        svg.addEventListener("mousemove", (event) => {
            this.currentTool.handleMouseMove(event);
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
            this.currentTool.handleKeyDown(keyboardEvent);
        }, { capture: true });
        document.addEventListener("keyup", (event) => {
            this.currentTool.handleKeyUp(event);
        }, { capture: true });
    }
}
