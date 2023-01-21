enum ToolMode {
    // various selection tools
    ConstraintEdit,
    // various constraint insertion tools
    ConstraintInsert,
    // cell editing tools
    CellEdit,
    // no possible effect on puzzle state
    NoOp,
}

abstract class ITool {
    protected toolBox: ToolBox;
    protected puzzleGrid: PuzzleGrid;
    protected actionStack: UndoRedoStack;
    protected sceneManager: SceneManager;

    constructor(toolBox: ToolBox, puzzleGrid: PuzzleGrid, actionStack: UndoRedoStack, sceneManager: SceneManager) {
        this.toolBox = toolBox;
        this.puzzleGrid = puzzleGrid;
        this.actionStack = actionStack;
        this.sceneManager = sceneManager;
    }

    abstract get mode(): ToolMode;

    // when user switches to this tool
    handlePickUp(_prevTool: ITool) {}
    // when user switches to another tool
    handlePutDown(_nextTool: ITool) {}
    // when the canvas receives click event with this tool
    handleMouseClick(_event: MouseEvent): boolean {return false;}
    // when the canvas receives dblclick event with this tool
    handleMouseDoubleClick(_event: MouseEvent): boolean {return false;}
    // when the canvas recevies mousedown event with this tool
    handleMouseDown(_event: MouseEvent): boolean {return false;}
    // when the canvas receives mouseup event with this tool
    handleMouseUp(_event: MouseEvent): boolean {return false;}
    // when the canvas receives mousemove event with this tool
    handleMouseMove(_event: MouseEvent): boolean {return false;}
    // when the canvas receives keydown event with this tool
    handleKeyDown(_event: KeyboardEvent): boolean {return false;}
    // when the canvas receives keyup event with this tool
    handleKeyUp(_event: KeyboardEvent): boolean {return false;}
}

class NoOpTool extends ITool {
    constructor(toolBox: ToolBox, puzzleGrid: PuzzleGrid, actionStack: UndoRedoStack, sceneManager: SceneManager) {
        super(toolBox, puzzleGrid, actionStack, sceneManager)
    }

    get mode(): ToolMode {
        return ToolMode.NoOp;
    }
}

class ToolBox {
    puzzleGrid: PuzzleGrid;
    actionStack: UndoRedoStack;
    sceneManager: SceneManager;
    tools: Array<ITool> = new Array();
    currentTool: ITool;

    switchToTool(tool: ITool): void {
        if (tool == this.currentTool) {
            return;
        }

        if (tool.mode != this.currentTool.mode) {
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

        const prevTool = this.currentTool;
        const nextTool = tool;

        this.currentTool.handlePutDown(nextTool);
        this.currentTool = tool;
        this.currentTool.handlePickUp(prevTool);
        console.debug(`Switching to ${tool.constructor.name}`);
    }

    constructor(puzzleGrid: PuzzleGrid, actionStack: UndoRedoStack, sceneManager: SceneManager) {
        this.puzzleGrid = puzzleGrid;
        this.actionStack = actionStack;
        this.sceneManager = sceneManager;
        this.currentTool = new NoOpTool(this, puzzleGrid, actionStack, sceneManager);

        const blueprints: Array<[string, new (toolBox: ToolBox, puzzleGrid: PuzzleGrid, actionStack: UndoRedoStack, sceneManager: SceneManager) => any, string | undefined]> = [
          ["object_selection_tool", ObjectSelectionTool, "KeyO"],
          ["rectangle_selection_tool", NoOpTool, undefined],
          ["move_tool", MoveTool, "KeyM"],
          ["grid_tool", GridTool, "KeyG"],
          ["digit_tool", DigitTool, "KeyZ"],
          ["center_tool", CenterTool, "KeyC"],
          ["corner_tool", CornerTool, "KeyX"],
          ["zoom_tool", ZoomTool, undefined],
          ["pan_tool", PanTool, undefined],
        ];

        for(let [id, toolConstructor, _code] of blueprints) {
            let tool = <ITool>new toolConstructor(this, puzzleGrid, actionStack, sceneManager);
            this.tools.push(tool);

            let button = document.querySelector(`div#${id}`);
            throwIfNull(button);
            button.addEventListener("click", () => {
                this.switchToTool(tool);
            });
        }

        // always start with the object selection tool
        this.currentTool = <ITool>this.tools.first();

        // register input events on the root svg element to forward to the tools
        let svg = <SVGSVGElement>document.querySelector("svg#canvas_root");
        throwIfNull(svg);
        svg.addEventListener("click", (event: Event) => {
            if (this.sceneManager.handleMouseClick(<MouseEvent>event)) {
                event.preventDefault();
                event.stopPropagation();
                return;
            }

            if (this.currentTool.handleMouseClick(<MouseEvent>event)) {
                event.preventDefault();
                event.stopPropagation();
                return;
            }
        });
        svg.addEventListener("dblclick", (event: Event) => {
            if (this.currentTool.handleMouseDoubleClick(<MouseEvent>event)) {
                event.preventDefault();
                event.stopPropagation();
            }
        });
        svg.addEventListener("mousedown", (event: Event) => {
            const mouseEvent = <MouseEvent>event;

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
        svg.addEventListener("mouseup", (event: Event) => {
            const mouseEvent = <MouseEvent>event;

            if (this.currentTool.handleMouseUp(mouseEvent)) {
                event.preventDefault();
                event.stopPropagation();
                return;
            }
        });
        svg.addEventListener("mousemove", (event: Event) => {
            const mouseEvent = <MouseEvent>event;

            if (this.sceneManager.handleMouseMove(mouseEvent)) {
                event.preventDefault();
                event.stopPropagation();
                return;
            }

            if (this.currentTool.handleMouseMove(<MouseEvent>event)) {
                event.preventDefault();
                event.stopPropagation();
                return;
            }
        });
        svg.addEventListener("wheel", (event: Event) => {
            if (this.sceneManager.handleWheel(<WheelEvent>event)) {
                event.preventDefault();
                event.stopPropagation();
            }
        });
        if ("ongesturestart" in globalThis && "ongesturechange" in globalThis) {
            svg.addEventListener("gesturestart", (event: Event) => {
                if (this.sceneManager.handleGestureStart(<GestureEvent>event)) {
                    event.preventDefault();
                    event.stopPropagation();
                }
            });
            svg.addEventListener("gesturechange", (event: Event) => {
                if (this.sceneManager.handleGestureChange(<GestureEvent>event)) {
                    event.preventDefault();
                    event.stopPropagation();
                }
            });
        } else {
            svg.addEventListener("touchstart", (event: Event) => {
                if (this.sceneManager.handleTouchStart(<TouchEvent>event)) {
                    event.preventDefault();
                    event.stopPropagation();
                }
            });
            svg.addEventListener("touchmove", (event: Event) => {
                if (this.sceneManager.handleTouchMove(<TouchEvent>event)) {
                    event.preventDefault();
                    event.stopPropagation();
                }
            });
        }
        document.addEventListener("keydown", (event: Event) => {
            // check for tool switching
            let keyboardEvent = <KeyboardEvent>event;
            if (!keyboardEvent.repeat &&
                !keyboardEvent.shiftKey &&
                !keyboardEvent.metaKey &&
                !keyboardEvent.ctrlKey &&
                !keyboardEvent.altKey) {

                for(let k = 0; k < blueprints.length; k++) {
                    let [_id, _toolConstructor, code] = blueprints[k];
                    if (code && keyboardEvent.code === code) {
                        this.switchToTool(this.tools[k]);
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
                } else {
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
        },{capture: true});
        document.addEventListener("keyup", (event: Event) => {
            const keyboardEvent = <KeyboardEvent>event;
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
        }, {capture: true});
    }
}