"use strict";
const AREA_KILLER = "killer";
class AreaTool extends ITool {
    constructor(toolBox, puzzleGrid, actionStack, sceneManager) {
        super(toolBox, puzzleGrid, actionStack, sceneManager);
        this.areaType = AREA_KILLER;
        // per-type values
        this.killerSum = 1;
        // tool data
        this.drawingArea = false;
        this.previousCell = null;
        this.cellsInArea = new BSTSet();
        this.graphic = new Graphic();
    }
    get mode() {
        return ToolMode.ConstraintInsert;
    }
    get toolSettings() {
        const settings = new Map();
        settings.set("Type", new SettingOption([
            [AREA_KILLER, "Killer"],
        ], this.areaType, (value) => {
            this.areaType = value;
            console.log(`area type: ${this.areaType}`);
        }));
        settings.set("Sum", new SettingDataInteger(this.killerSum, 1, 45, (value) => {
            console.log(`new killer sum: ${value}`);
            this.killerSum = value;
        }));
        return settings;
    }
    handleMouseDown(event) {
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
    handleMouseUp(event) {
        if (!event.primaryButton && this.drawingArea) {
            this.drawingArea = false;
            this.sceneManager.removeGraphic(this.graphic);
            let areaConstraint = new KillerCageConstraint(new Array(...this.cellsInArea), this.killerSum, this.graphic);
            let action = new InsertConstraintAction(this.puzzleGrid, this.sceneManager, areaConstraint);
            this.actionStack.doAction(action);
            this.graphic = new Graphic();
            return true;
        }
        return false;
    }
    handleMouseMove(event) {
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
    drawArea(cells) {
        const boundingBox = BoundingBox.fromCells(...cells);
        // find left-most cell in top row
        const origin = new Cell(boundingBox.top, boundingBox.left);
        let labelCellOffset = null;
        for (let j = boundingBox.left; j <= boundingBox.right; j++) {
            let cell = new Cell(origin.i, j);
            if (cells.has(cell)) {
                labelCellOffset = j - boundingBox.left;
                break;
            }
        }
        throwIfNull(labelCellOffset);
        const graphic = new Graphic();
        const edgeGroup = this.sceneManager.createElement("g", SVGGElement);
        edgeGroup.setAttribute("transform", `translate(${origin.left},${origin.top})`);
        const DASH_SIZE = CELL_SIZE / 16;
        const INSET = CELL_SIZE / 16;
        switch (this.areaType) {
            case AREA_KILLER:
                edgeGroup.setAttributes(["stroke", "black"], ["stroke-dasharray", `${DASH_SIZE}`], ["stroke-dashoffset", `${-DASH_SIZE / 2}`], ["stroke-width", "1.5"]);
                break;
        }
        for (let cell of cells) {
            const normCell = new Cell(cell.i - origin.i, cell.j - origin.j);
            let neighbors = DirectionFlag.neighborDirections(cell, cells);
            let edge = SVGTileSet.getEdge(normCell, neighbors, INSET, this.sceneManager);
            edgeGroup.appendChild(edge);
        }
        let text = this.sceneManager.createElement("text", SVGTextElement);
        text.setAttributes(["text-anchor", "start"], ["dominant-baseline", "hanging"], ["x", `${labelCellOffset * CELL_SIZE + INSET * 1.5}`], ["y", `${INSET}`], ["font-size", `${CELL_SIZE / 6}`], ["font-family", "sans-serif"], ["paint-order", "stroke fill"], ["fill", Colour.Black.toString()], ["stroke", Colour.White.toString()], ["stroke-width", "4"], ["stroke-dasharray", "none"]);
        text.textContent = `${this.killerSum}`;
        edgeGroup.appendChild(text);
        graphic.set(RenderLayer.Constraints, edgeGroup);
        return graphic;
    }
}
