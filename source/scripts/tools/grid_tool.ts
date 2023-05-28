type GridType = "9x9" | "8x8-horizontal" | "8x8-vertical" | "6x6-horizontal" | "6x6-vertical" | "4x4";
const GRID_9X9: GridType = "9x9";
const GRID_8X8_H: GridType = "8x8-horizontal";
const GRID_8X8_V: GridType = "8x8-vertical";
const GRID_6X6_H: GridType = "6x6-horizontal";
const GRID_6X6_V: GridType = "6x6-vertical";
const GRID_4X4: GridType = "4x4";

class InsertGridAction extends IAction {
    override apply(): void {
        // register the constrained cells
        this.puzzleGrid.addConstraint(this.gridConstraint);
        // check for constraint violations
        this.puzzleGrid.checkCellsForConstraintViolations(...this.gridConstraint.cells);
        // add the svg
        this.sceneManager.addElement(this.gridConstraint.svg, RenderLayer.Grid);
        // update the selection box
        this.puzzleGrid.updateSelectionBox();
    }
    override revert(): void {
        // remove the constrained cells
        this.puzzleGrid.removeConstraint(this.gridConstraint);
        // check for constraint violations
        this.puzzleGrid.checkCellsForConstraintViolations(...this.gridConstraint.cells);
        // remove the svg
        this.sceneManager.removeElement(this.gridConstraint.svg);
        // update the selection box
        this.puzzleGrid.updateSelectionBox();
    }

    puzzleGrid: PuzzleGrid;
    sceneManager: SceneManager;
    gridConstraint: IConstraint;

    constructor(puzzleGrid: PuzzleGrid, sceneManager: SceneManager, cell: Cell, gridType: GridType) {
        super(`insert ${gridType} grid at ${cell}`);
        this.puzzleGrid = puzzleGrid;
        this.sceneManager = sceneManager;

        switch(gridType) {
        case GRID_9X9: this.gridConstraint = new Grid9x9Constraint(sceneManager, cell); break;
        case GRID_8X8_H: this.gridConstraint = new Grid8x8HorizontalConstraint(sceneManager, cell); break;
        case GRID_8X8_V: this.gridConstraint = new Grid8x8VerticalConstraint(sceneManager, cell); break;
        case GRID_6X6_H: this.gridConstraint = new Grid6x6HorizontalConstraint(sceneManager, cell); break;
        case GRID_6X6_V: this.gridConstraint = new Grid6x6VerticalConstraint(sceneManager, cell); break;
        case GRID_4X4: this.gridConstraint = new Grid4x4Constraint(sceneManager, cell); break;
        default: throwMessage(`grid type '${gridType}' not implemented`);
        }
    }
}

class GridTool extends ITool {
    gridType: GridType = GRID_9X9;

    constructor(toolBox: ToolBox, puzzleGrid: PuzzleGrid, actionStack: UndoRedoStack, sceneManager: SceneManager) {
        super(toolBox, puzzleGrid, actionStack, sceneManager);
    }

    get mode(): ToolMode {
        return ToolMode.ConstraintInsert;
    }

    override get toolSettings(): Map<string, Setting> {
        return new Map([
            ["Grid Size", new SettingOption([
                    [GRID_9X9, "9x9"],
                    [GRID_8X8_H, "8x8 (horizontal)"],
                    [GRID_8X8_V, "8x8 (vertical)"],
                    [GRID_6X6_H, "6x6 (horizontal)"],
                    [GRID_6X6_V, "6x6 (vertical)"],
                    [GRID_4X4, "4x4"],
                ], (value: string): void => {
                    this.gridType = <GridType>value;
                    console.log(`grid type: ${this.gridType}`);
                })],
        ]);
    }

    //
    // ITool interface
    //

    // when the canvas receives click event with this tool
    override handleMouseClick(event: MouseEvent): boolean {
        const cell = this.sceneManager.cellAtMouseEvent(event);
        this.insertGrid(cell);
        return true;
    }

    //
    // Private methods
    //

    private insertGrid(cell: Cell) {
        let action = new InsertGridAction(this.puzzleGrid, this.sceneManager, cell, this.gridType);
        this.actionStack.doAction(action);
    }
}