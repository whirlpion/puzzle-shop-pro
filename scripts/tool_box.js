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
            ["object_selection_tool", ObjectSelectionTool, "O"],
            ["rectangle_selection_tool", NoOpTool, null],
            ["grid_tool", GridTool, "G"],
            ["digit_tool", DigitTool, "Z"],
        ];
        for (let [id, toolConstructor, shortcut] of blueprints) {
            let tool = new toolConstructor(puzzleGrid, actionStack, sceneManager);
            this.tools.push(tool);
            let button = document.querySelector(`div#${id}`);
            throwIfNull(button);
            button.addEventListener("click", () => {
                this.switchToTool(tool);
            });
            document.addEventListener("keydown", (event) => {
                let keyboardEvent = event;
                if (keyboardEvent.shiftKey ||
                    keyboardEvent.metaKey ||
                    keyboardEvent.ctrlKey ||
                    keyboardEvent.altKey) {
                    return;
                }
                if (keyboardEvent.key.toUpperCase() === shortcut) {
                    this.switchToTool(tool);
                    event.stopPropagation();
                }
            }, { capture: true }); // we want to handle tool switch last
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
            this.currentTool.handleKeyDown(event);
        });
        document.addEventListener("keyup", (event) => {
            this.currentTool.handleKeyUp(event);
        });
    }
}
