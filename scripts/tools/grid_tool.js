"use strict";
const GRID_9X9 = "9x9";
const GRID_8X8_H = "8x8-horizontal";
const GRID_8X8_V = "8x8-vertical";
const GRID_6X6_H = "6x6-horizontal";
const GRID_6X6_V = "6x6-vertical";
const GRID_4X4 = "4x4";
class GridTool extends ITool {
    constructor(toolBox, puzzleGrid, actionStack, sceneManager) {
        super(toolBox, puzzleGrid, actionStack, sceneManager);
        this.gridType = GRID_9X9;
    }
    get mode() {
        return ToolMode.ConstraintInsert;
    }
    get toolSettings() {
        const retval = new Map();
        retval.set("Grid Size", new SettingOption([
            [GRID_9X9, "9x9"],
            [GRID_8X8_H, "8x8 (horizontal)"],
            [GRID_8X8_V, "8x8 (vertical)"],
            [GRID_6X6_H, "6x6 (horizontal)"],
            [GRID_6X6_V, "6x6 (vertical)"],
            [GRID_4X4, "4x4"],
        ], this.gridType, (value) => {
            this.gridType = value;
            console.log(`grid type: ${this.gridType}`);
        }));
        return retval;
    }
    //
    // ITool interface
    //
    // when the canvas receives click event with this tool
    handleMouseClick(event) {
        const cell = this.sceneManager.cellAtMouseEvent(event);
        this.insertGrid(cell);
        return true;
    }
    //
    // Private methods
    //
    insertGrid(cell) {
        let constraint = null;
        switch (this.gridType) {
            case GRID_9X9:
                constraint = new Grid9x9Constraint(this.sceneManager, cell);
                break;
            case GRID_8X8_H:
                constraint = new Grid8x8HorizontalConstraint(this.sceneManager, cell);
                break;
            case GRID_8X8_V:
                constraint = new Grid8x8VerticalConstraint(this.sceneManager, cell);
                break;
            case GRID_6X6_H:
                constraint = new Grid6x6HorizontalConstraint(this.sceneManager, cell);
                break;
            case GRID_6X6_V:
                constraint = new Grid6x6VerticalConstraint(this.sceneManager, cell);
                break;
            case GRID_4X4:
                constraint = new Grid4x4Constraint(this.sceneManager, cell);
                break;
            default: throwMessage(`grid type '${this.gridType}' not implemented`);
        }
        let action = new InsertConstraintAction(this.puzzleGrid, this.sceneManager, constraint);
        this.actionStack.doAction(action);
    }
}
