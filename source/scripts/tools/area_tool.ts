type AreaType = "killer"
const AREA_KILLER: AreaType = "killer";

class AreaTool extends ITool {
    areaType: AreaType  = AREA_KILLER;

    drawingArea: boolean = false;
    previousCell: Cell | null = null;
    cellsInArea: BSTSet<Cell> = new BSTSet();
    graphic: Graphic = new Graphic();

    constructor(toolBox: ToolBox, puzzleGrid: PuzzleGrid, actionStack: UndoRedoStack, sceneManager: SceneManager) {
        super(toolBox, puzzleGrid, actionStack, sceneManager)
    }



    get mode(): ToolMode {
        return ToolMode.ConstraintInsert;
    }

    override get toolSettings(): Map<string, Setting> {
        const retval: Map<string, Setting> = new Map();
        retval.set("Type", new SettingOption([
                    [AREA_KILLER, "Killer"],
                ], this.areaType, (value: string): void => {
                    this.areaType = <AreaType>value;
                    console.log(`area type: ${this.areaType}`);
                }));
        return retval;
    }

    override handleMouseDown(event: MouseEvent): boolean {
        if (event.primaryButton) {

            this.cellsInArea = new BSTSet();
            const cell = this.sceneManager.cellAtMouseEvent(event);
            this.cellsInArea.add(cell);
            this.drawingArea = true;
            this.previousCell = cell;

            this.sceneManager.removeGraphic(this.graphic);
            this.graphic = this.drawArea(this.cellsInArea);
            this.sceneManager.addGraphic(this.graphic);

            return true;
        }
        return false;
    }

    override handleMouseUp(event: MouseEvent): boolean {
        if (!event.primaryButton && this.drawingArea) {
            this.drawingArea = false;

            this.sceneManager.removeGraphic(this.graphic);

            let areaConstraint = new KillerCageConstraint(new Array(...this.cellsInArea), this.graphic);
            let action = new InsertConstraintAction(this.puzzleGrid, this.sceneManager, areaConstraint);
            this.actionStack.doAction(action);

            this.graphic = new Graphic();

            return true;
        }
        return false;
    }


    override handleMouseMove(event: MouseEvent): boolean {
        if (event.primaryButton && this.drawingArea) {
            const newCell = this.sceneManager.cellAtMouseEvent(event);
            const prevCell = this.previousCell;

            throwIfNull(prevCell);
            if (prevCell.equals(newCell)) {
                return false;
            }
            const prevAreaSize = this.cellsInArea.size;
            this.cellsInArea.add(...Cell.bresenhamLine(prevCell, newCell));
            if (this.cellsInArea.size == prevAreaSize) {
                return false;
            }

            this.previousCell = newCell;

            this.sceneManager.removeGraphic(this.graphic);
            this.graphic = this.drawArea(this.cellsInArea);
            this.sceneManager.addGraphic(this.graphic);

            return true;
        }
        return false;
    }

    private drawArea(cells: BSTSet<Cell>): Graphic {

        const boundingBox = BoundingBox.fromCells(...cells);
        const origin = new Cell(boundingBox.top, boundingBox.left);

        const graphic = new Graphic();

        const edgeGroup = this.sceneManager.createElement("g", SVGGElement);
        edgeGroup.setAttribute("transform", `translate(${origin.left},${origin.top})`);

        const DASH_SIZE = CELL_SIZE / 8;
        switch (this.areaType) {
        case AREA_KILLER:
            edgeGroup.setAttributes(
                ["stroke", "black"],
                ["stroke-dasharray", `0 ${DASH_SIZE/2} ${DASH_SIZE} ${DASH_SIZE/2}`],
                ["stroke-width", "1"]
            );
            break;
        }

        for (let cell of cells) {
            const normCell = new Cell(cell.i - origin.i, cell.j - origin.j);
            let neighbors = DirectionFlag.neighborDirections(cell, cells);
            let edge = SVGTileSet.getEdge(normCell, neighbors, DASH_SIZE, this.sceneManager);
            edgeGroup.appendChild(edge);
        }

        graphic.set(RenderLayer.Constraints, edgeGroup);

        return graphic;
    }
}