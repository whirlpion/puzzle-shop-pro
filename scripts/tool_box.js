"use strict";
var ToolMode;
(function (ToolMode) {
    // various selection tools
    ToolMode[ToolMode["ConstraintEdit"] = 0] = "ConstraintEdit";
    // various constraint insertion tools
    ToolMode[ToolMode["ConstraintInsert"] = 1] = "ConstraintInsert";
    // cell editing tools
    ToolMode[ToolMode["CellEdit"] = 2] = "CellEdit";
    // no possible effect on puzzle state
    ToolMode[ToolMode["NoOp"] = 3] = "NoOp";
})(ToolMode || (ToolMode = {}));
var ToolID;
(function (ToolID) {
    ToolID[ToolID["First"] = 0] = "First";
    // constraint interaction
    ToolID[ToolID["ObjectSelection"] = 0] = "ObjectSelection";
    ToolID[ToolID["RectangleSelection"] = 1] = "RectangleSelection";
    ToolID[ToolID["Move"] = 2] = "Move";
    // constraint tools
    ToolID[ToolID["Grid"] = 3] = "Grid";
    ToolID[ToolID["Line"] = 4] = "Line";
    // digit tools
    ToolID[ToolID["Digit"] = 5] = "Digit";
    ToolID[ToolID["Center"] = 6] = "Center";
    ToolID[ToolID["Corner"] = 7] = "Corner";
    // navigation
    ToolID[ToolID["Zoom"] = 8] = "Zoom";
    ToolID[ToolID["Pan"] = 9] = "Pan";
    // the number of tools
    ToolID[ToolID["Count"] = 10] = "Count";
})(ToolID || (ToolID = {}));
class ITool {
    constructor(toolBox, puzzleGrid, actionStack, sceneManager) {
        this.toolBox = toolBox;
        this.puzzleGrid = puzzleGrid;
        this.actionStack = actionStack;
        this.sceneManager = sceneManager;
    }
    get toolSettings() {
        return new Map();
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
    constructor(toolBox, puzzleGrid, actionStack, sceneManager) {
        super(toolBox, puzzleGrid, actionStack, sceneManager);
    }
    get mode() {
        return ToolMode.NoOp;
    }
}
class ToolBox {
    get currentTool() {
        let tool = this.tools[this.currentToolId];
        throwIfUndefined(tool);
        return tool;
    }
    switchToTool(toolId) {
        if (toolId === this.currentToolId) {
            return;
        }
        const nextTool = this.tools[toolId];
        const prevTool = this.tools[this.currentToolId];
        if (nextTool.mode != prevTool.mode) {
            switch (this.currentTool.mode) {
                case ToolMode.ConstraintEdit:
                    this.puzzleGrid.clearSelectedConstraints();
                    this.puzzleGrid.updateSelectionBox();
                    break;
                case ToolMode.ConstraintInsert: break;
                case ToolMode.CellEdit:
                    this.puzzleGrid.clearAllHighlights();
                    break;
                case ToolMode.NoOp: break;
            }
        }
        prevTool.handlePutDown(nextTool);
        nextTool.handlePickUp(prevTool);
        // set selected state
        document.querySelector(`div#${this.blueprints[this.currentToolId].id}`)?.classList.remove("selected");
        document.querySelector(`div#${this.blueprints[toolId].id}`)?.classList.add("selected");
        this.currentToolId = toolId;
        this.toolOptionsPanel.clearChildren();
        const toolSettings = this.currentTool.toolSettings;
        this.toolOptionsPanel.initSettings(toolSettings);
        console.debug(`Switching to ${nextTool.constructor.name}`);
    }
    constructor(puzzleGrid, actionStack, sceneManager) {
        this.tools = new Array();
        this.currentToolId = ToolID.ObjectSelection;
        this.blueprints = [
            { id: "object_selection_tool", toolConstructor: ObjectSelectionTool, shortcut: "KeyO" },
            { id: "rectangle_selection_tool", toolConstructor: NoOpTool, shortcut: undefined },
            { id: "move_tool", toolConstructor: MoveTool, shortcut: "KeyM" },
            { id: "grid_tool", toolConstructor: GridTool, shortcut: "KeyG" },
            { id: "line_tool", toolConstructor: LineTool, shortcut: "KeyL" },
            { id: "digit_tool", toolConstructor: DigitTool, shortcut: "KeyZ" },
            { id: "corner_tool", toolConstructor: CornerTool, shortcut: "KeyX" },
            { id: "center_tool", toolConstructor: CenterTool, shortcut: "KeyC" },
            { id: "colour_tool", toolConstructor: ColourTool, shortcut: "KeyV" },
            { id: "zoom_tool", toolConstructor: ZoomTool, shortcut: undefined },
            { id: "pan_tool", toolConstructor: PanTool, shortcut: undefined },
        ];
        this.puzzleGrid = puzzleGrid;
        this.actionStack = actionStack;
        this.sceneManager = sceneManager;
        let toolOptionsPanelRoot = document.querySelector("div#tool_options_panel");
        throwIfNull(toolOptionsPanelRoot);
        throwIfNotType(toolOptionsPanelRoot, HTMLDivElement);
        this.toolOptionsPanel = new ToolOptionsPanel(toolOptionsPanelRoot);
        // always start with the object selection tool
        this.currentToolId = ToolID.ObjectSelection;
        // construct our toolbox
        for (let k = ToolID.First; k < ToolID.Count; k++) {
            let blueprint = this.blueprints[k];
            const id = blueprint.id;
            const toolConstructor = blueprint.toolConstructor;
            let tool = new toolConstructor(this, puzzleGrid, actionStack, sceneManager);
            this.tools.push(tool);
            let button = document.querySelector(`div#${id}`);
            throwIfNull(button);
            button.addEventListener("click", () => {
                this.switchToTool(k);
            });
        }
        // register input events on the root svg element to forward to the tools
        let svg = document.querySelector("svg#canvas_root");
        throwIfNull(svg);
        svg.addEventListener("click", (event) => {
            if (this.sceneManager.handleMouseClick(event)) {
                event.preventDefault();
                event.stopPropagation();
                return;
            }
            if (this.currentTool.handleMouseClick(event)) {
                event.preventDefault();
                event.stopPropagation();
                return;
            }
        });
        svg.addEventListener("dblclick", (event) => {
            if (this.currentTool.handleMouseDoubleClick(event)) {
                event.preventDefault();
                event.stopPropagation();
            }
        });
        svg.addEventListener("mousedown", (event) => {
            const mouseEvent = event;
            if (this.sceneManager.handleMouseDown(mouseEvent)) {
                event.preventDefault();
                event.stopPropagation();
                return;
            }
            if (this.currentTool.handleMouseDown(mouseEvent)) {
                event.preventDefault();
                event.stopPropagation();
                return;
            }
        });
        svg.addEventListener("mouseup", (event) => {
            const mouseEvent = event;
            if (this.currentTool.handleMouseUp(mouseEvent)) {
                event.preventDefault();
                event.stopPropagation();
                return;
            }
        });
        svg.addEventListener("mousemove", (event) => {
            const mouseEvent = event;
            if (this.sceneManager.handleMouseMove(mouseEvent)) {
                event.preventDefault();
                event.stopPropagation();
                return;
            }
            if (this.currentTool.handleMouseMove(event)) {
                event.preventDefault();
                event.stopPropagation();
                return;
            }
        });
        svg.addEventListener("wheel", (event) => {
            if (this.sceneManager.handleWheel(event)) {
                event.preventDefault();
                event.stopPropagation();
            }
        });
        if ("ongesturestart" in globalThis && "ongesturechange" in globalThis) {
            svg.addEventListener("gesturestart", (event) => {
                if (this.sceneManager.handleGestureStart(event)) {
                    event.preventDefault();
                    event.stopPropagation();
                }
            });
            svg.addEventListener("gesturechange", (event) => {
                if (this.sceneManager.handleGestureChange(event)) {
                    event.preventDefault();
                    event.stopPropagation();
                }
            });
        }
        else {
            svg.addEventListener("touchstart", (event) => {
                if (this.sceneManager.handleTouchStart(event)) {
                    event.preventDefault();
                    event.stopPropagation();
                }
            });
            svg.addEventListener("touchmove", (event) => {
                if (this.sceneManager.handleTouchMove(event)) {
                    event.preventDefault();
                    event.stopPropagation();
                }
            });
        }
        document.addEventListener("keydown", (event) => {
            // check for tool switching
            let keyboardEvent = event;
            if (!keyboardEvent.repeat &&
                !keyboardEvent.shiftKey &&
                !keyboardEvent.metaKey &&
                !keyboardEvent.ctrlKey &&
                !keyboardEvent.altKey) {
                for (let k = ToolID.First; k < ToolID.Count; k++) {
                    let blueprint = this.blueprints[k];
                    const shortcut = blueprint.shortcut;
                    if (shortcut && keyboardEvent.code === shortcut) {
                        this.switchToTool(k);
                        event.preventDefault();
                        event.stopPropagation();
                        return;
                    }
                }
            }
            if (this.sceneManager.handleKeyDown(keyboardEvent)) {
                event.preventDefault();
                event.stopPropagation();
                return;
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
                return;
            }
        });
        document.addEventListener("keyup", (event) => {
            const keyboardEvent = event;
            if (this.sceneManager.handleKeyUp(keyboardEvent)) {
                event.preventDefault();
                event.stopPropagation();
                return;
            }
            if (this.currentTool.handleKeyUp(keyboardEvent)) {
                event.preventDefault();
                event.stopPropagation();
                return;
            }
        });
    }
}
