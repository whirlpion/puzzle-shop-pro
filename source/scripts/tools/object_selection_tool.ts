class ObjectSelectionTool extends ITool {
    selectionBox: SVGRectElement;

    constructor(toolBox: ToolBox, puzzleGrid: PuzzleGrid, actionStack: UndoRedoStack, sceneManager: SceneManager) {
        super(toolBox, puzzleGrid, actionStack, sceneManager);
        this.selectionBox = sceneManager.createElement("rect", SVGRectElement, RenderLayer.Foreground);
        this.selectionBox.setAttributes(
            ["fill", "none"],
            ["stroke", "black"],
            ["stroke-dasharray", "5,6,10,6,5,0"],
            ["stroke-width", "2"],
            ["visibility", "hidden"]);
    }

    private updateSelectionBox(boundingBox: BoundingBox): void {
        const MARGIN = CELL_SIZE / 4;
        let x = boundingBox.j * CELL_SIZE - MARGIN;
        let y = boundingBox.i * CELL_SIZE - MARGIN;
        let width = boundingBox.columns * CELL_SIZE + 2 * MARGIN;
        let height = boundingBox.rows * CELL_SIZE + 2 * MARGIN;;

        this.selectionBox.setAttributes(
            ["x", `${x}`],
            ["y", `${y}`],
            ["width", `${width}`],
            ["height", `${height}`],
            ["visibility", "visible"]);
    }

    private hideSelectionBox(): void {
        this.selectionBox.setAttributes(
            ["visibility", "hidden"]);
    }

    override handleMouseClick(event: MouseEvent): boolean {
        let cell = this.sceneManager.cellAtMouseEvent(event);

        // get all the constraints at this cell
        let constraints = this.puzzleGrid.getConstraintsAtCell(cell);

        if (constraints.length > 0) {
            // construct list of bounding boxes
            let boundingBoxes: Array<BoundingBox> = new Array();
            for (let constraint of constraints) {
                boundingBoxes.push(constraint.boundingBox);
            }

            // join them all together
            this.updateSelectionBox(BoundingBox.union(...boundingBoxes));
        } else {
            this.hideSelectionBox();
        }
        return true;
    }
}