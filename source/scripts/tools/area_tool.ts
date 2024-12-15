type AreaType = "killer"
const AREA_KILLER: AreaType = "killer";

class AreaTool extends ITool {
    areaType: AreaType  = AREA_KILLER;

    killerTileset: SVGTileSet;

    drawingArea: boolean = false;
    previousCell: Cell | null = null;
    cellsInArea: BSTSet<Cell> = new BSTSet();
    currentTileset: SVGTileSet | null = null;
    graphic: Graphic = new Graphic();

    constructor(toolBox: ToolBox, puzzleGrid: PuzzleGrid, actionStack: UndoRedoStack, sceneManager: SceneManager) {
        super(toolBox, puzzleGrid, actionStack, sceneManager)

        this.killerTileset = new SVGTileSet(sceneManager, CELL_SIZE / 16);
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
            // set rendering tileset
            switch (this.areaType) {
            case AREA_KILLER:
                this.currentTileset = this.killerTileset; break;
            }

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

        throwIfNull(this.currentTileset);

        const boundingBox = BoundingBox.fromCells(...cells);
        const origin = new Cell(boundingBox.top, boundingBox.left);

        const graphic = new Graphic();

        const edgeGroup = this.sceneManager.createElement("g", SVGGElement);
        edgeGroup.setAttribute("transform", `translate(${origin.left},${origin.top})`);

        switch (this.areaType) {
        case AREA_KILLER:
            const DASH_SIZE = CELL_SIZE * 15/16*  1/5;
            edgeGroup.setAttributes(
                ["stroke", "black"],
                ["stroke-dasharray", `${DASH_SIZE} ${DASH_SIZE}`],
                ["stroke-width", "1"]
            );
            break;
        }

        for (let cell of cells) {
            const normCell = new Cell(cell.i - origin.i, cell.j - origin.j);
            let neighbors = DirectionFlag.neighborDirections(cell, cells);
            let edge = this.currentTileset.getEdge(normCell, neighbors);
            edgeGroup.appendChild(edge);
        }

        graphic.set(RenderLayer.Constraints, edgeGroup);

        return graphic;
    }
}