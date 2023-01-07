enum Tool {
    ObjectSelection,
    RectangleSelection,
    GridInsertion,
}

abstract class ITool {
    protected sceneManager: SceneManager;
    protected actionStack: UndoRedoStack;
    protected puzzleGrid: PuzzleGrid;
    constructor(puzzleGrid: PuzzleGrid, actionStack: UndoRedoStack, sceneManager: SceneManager) {
        this.puzzleGrid = puzzleGrid;
        this.actionStack = actionStack;
        this.sceneManager = sceneManager;
    }

    // when user switches to this tool
    handlePickUp(_prevTool: ITool) {}
    // when user switches to another tool
    handlePutDown(_nextTool: ITool) {}
    // when the canvas receives click event with this tool
    handleMouseClick(_event: MouseEvent) {}
    // when the canvas receives dblclick event with this tool
    handleMouseDoubleClick(_event: MouseEvent) {}
    // when the canvas recevies mousedown event with this tool
    handleMouseDown(_event: MouseEvent) {}
    // when the canvas receives mouseup event with this tool
    handleMouseUp(_event: MouseEvent) {}
    // when the canvas receives mousemove event with this tool
    handleMouseMove(_event: MouseEvent) {}
    // when the canvas receives keydown event with this tool
    handleKeyDown(_event: KeyboardEvent) {}
    // when the canvas receives keyup event with this tool
    handleKeyUp(_event: KeyboardEvent) {}
}

class NoOpTool extends ITool {
    constructor(puzzleGrid: PuzzleGrid, actionStack: UndoRedoStack, sceneManager: SceneManager) {
        super(puzzleGrid, actionStack, sceneManager)
    }
}

class ToolBox {
    puzzleGrid: PuzzleGrid;
    actionStack: UndoRedoStack;
    sceneManager: SceneManager;
    tools: Array<ITool> = new Array();
    currentTool: ITool;

    private switchToTool(tool: ITool): void {
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

    constructor(puzzleGrid: PuzzleGrid, actionStack: UndoRedoStack, sceneManager: SceneManager) {
        this.puzzleGrid = puzzleGrid;
        this.actionStack = actionStack;
        this.sceneManager = sceneManager;
        this.currentTool = new NoOpTool(puzzleGrid, actionStack, sceneManager);

        const blueprints: Array<[string, new (puzzleGrid: PuzzleGrid, actionStack: UndoRedoStack, sceneManager: SceneManager) => any, string | undefined]> = [
          ["object_selection_tool", ObjectSelectionTool, "KeyO"],
          ["rectangle_selection_tool", NoOpTool, undefined],
          ["grid_tool", GridTool, "KeyG"],
          ["digit_tool", DigitTool, "KeyZ"],
          ["center_tool", CenterTool, "KeyC"],
          ["corner_tool", CornerTool, "KeyX"],
        ];

        for(let [id, toolConstructor, _code] of blueprints) {
            let tool = <ITool>new toolConstructor(puzzleGrid, actionStack, sceneManager);
            this.tools.push(tool);

            let button = document.querySelector(`div#${id}`);
            throwIfNull(button);
            button.addEventListener("click", () => {
                this.switchToTool(tool);
            });
        }

        // always start with the object selection tool
        this.currentTool = <ITool>this.tools[Tool.ObjectSelection];

        // register input events on the root svg element to forward to the tools
        let svg = <SVGSVGElement>document.querySelector("svg#canvas_root");
        throwIfNull(svg);
        svg.addEventListener("click", (event: Event) => {
            this.currentTool.handleMouseClick(<MouseEvent>event);
        });
        svg.addEventListener("dblclick", (event: Event) => {
            this.currentTool.handleMouseDoubleClick(<MouseEvent>event);
        });
        svg.addEventListener("mousedown", (event: Event) => {
            this.currentTool.handleMouseDown(<MouseEvent>event);
        });
        svg.addEventListener("mouseup", (event: Event) => {
            this.currentTool.handleMouseUp(<MouseEvent>event);
        });
        svg.addEventListener("mousemove", (event: Event) => {
            this.currentTool.handleMouseMove(<MouseEvent>event);
        });
        document.addEventListener("keydown", (event: Event) => {
            // check for tool switching
            let keyboardEvent = <KeyboardEvent>event;
            if (!keyboardEvent.shiftKey &&
                !keyboardEvent.metaKey &&
                !keyboardEvent.ctrlKey &&
                !keyboardEvent.altKey) {

                for(let k = 0; k < blueprints.length; k++) {
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
                } else {
                    this.actionStack.redo();
                }
                event.preventDefault();
                event.stopPropagation();
                return;
            }

            // propagate to tools
            this.currentTool.handleKeyDown(keyboardEvent);
        },{capture: true});
        document.addEventListener("keyup", (event: Event) => {
            this.currentTool.handleKeyUp(<KeyboardEvent>event);
        }, {capture: true});
    }
}