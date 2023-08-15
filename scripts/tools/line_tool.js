"use strict";
const LINE_THERMO = "thermo";
class LineTool extends ITool {
    constructor(toolBox, puzzleGrid, actionStack, sceneManager) {
        super(toolBox, puzzleGrid, actionStack, sceneManager);
        this.lineType = LINE_THERMO;
        this.drawingLine = false;
        this.cellsInLine = new Array();
        this.graphic = new Graphic();
    }
    get mode() {
        return ToolMode.ConstraintInsert;
    }
    get toolSettings() {
        const retval = new Map();
        retval.set("Type", new SettingOption([
            [LINE_THERMO, "Thermo"]
        ], this.lineType, (value) => {
            this.lineType = value;
            console.log(`line type: ${this.lineType}`);
        }));
        return retval;
    }
    handleMouseClick(_event) {
        return false;
    }
    handleMouseDown(event) {
        if (event.primaryButton) {
            this.cellsInLine = new Array();
            const cell = this.sceneManager.cellAtMouseEvent(event);
            this.cellsInLine.push(cell);
            this.drawingLine = true;
            this.sceneManager.removeGraphic(this.graphic);
            this.graphic = this.drawLine(this.cellsInLine);
            this.sceneManager.addGraphic(this.graphic);
            return true;
        }
        return false;
    }
    handleMouseUp(event) {
        if (!event.primaryButton && this.drawingLine) {
            console.log("cells: ", this.cellsInLine);
            this.drawingLine = false;
            this.sceneManager.removeGraphic(this.graphic);
            if (this.cellsInLine.length > 1) {
                let lineConstraint = new ThermoConstraint(this.cellsInLine, this.graphic);
                let action = new InsertConstraintAction(this.puzzleGrid, this.sceneManager, lineConstraint);
                this.actionStack.doAction(action);
            }
            this.graphic = new Graphic();
            return true;
        }
        return false;
    }
    // this needs to handle laggy movement, going through diagonals, etc
    handleMouseMove(event) {
        if (event.primaryButton && this.drawingLine) {
            const newCell = this.sceneManager.cellAtMouseEvent(event);
            const prevCell = this.cellsInLine.last();
            throwIfNotType(prevCell, Cell);
            if (prevCell.equals(newCell)) {
                return false;
            }
            else {
                if (prevCell.adjacentKingsMove(newCell)) {
                    const nearCenter = this.sceneManager.mouseEventNearCellCenter(event);
                    if (nearCenter) {
                        this.cellsInLine.push(newCell);
                    }
                    else {
                        return false;
                    }
                }
                else {
                    let points = Cell.bresenhamLine(prevCell, newCell);
                    for (let i = 1; i < points.length; i++) {
                        this.cellsInLine.push(points[i]);
                    }
                    console.log("points: ", points.join("|"));
                    console.log("cells in line: ", this.cellsInLine.join("|"));
                }
            }
            // prune cells to allow backtracking/path simplicifation
            // iteratively remove palindromic sequences like a so:
            // |1 2 3 2 1| 2 3 4 5 4 3 2
            // |1 2 1| 2 3 4 5 4 3 2
            // 1 |2 3 4 5 4 3 2|
            // 1 2
            let middle = 1; // middle of proposed palindrome
            const cil = this.cellsInLine;
            while (middle < cil.length - 1) {
                let extent = 1; // extent of proposed palindrome
                let palindromeFound = false;
                do {
                    // palindrome canidate bounds
                    const left = middle - extent;
                    const right = middle + extent;
                    if (left >= 0 && right < cil.length &&
                        cil.isPalindrome(left, right - left + 1)) {
                        palindromeFound = true;
                        extent++;
                    }
                    else {
                        extent--;
                        break;
                    }
                } while (true);
                if (palindromeFound) {
                    cil.splice(middle - extent, 2 * extent);
                    middle = 1;
                }
                else {
                    middle++;
                }
            }
            this.sceneManager.removeGraphic(this.graphic);
            this.graphic = this.drawLine(this.cellsInLine);
            this.sceneManager.addGraphic(this.graphic);
            return true;
        }
        return false;
    }
    drawLine(cells) {
        let boundingBox = BoundingBox.fromCells(...cells);
        const origin = new Cell(boundingBox.top, boundingBox.left);
        let first = cells.first();
        throwIfUndefined(first);
        first = new Cell(first.i - origin.i, first.j - origin.j);
        // generate points for polyline
        const points = new Array();
        for (let cell of cells) {
            // normalize points on our first cell
            const normCell = new Cell(cell.i - origin.i, cell.j - origin.j);
            const point = normCell.center;
            points.push(`${point.x},${point.y}`);
        }
        let graphic = new Graphic();
        // outline
        {
            const group = this.sceneManager.createElement("g", SVGGElement);
            group.setAttribute("transform", `translate(${origin.left},${origin.top})`);
            const polyline = this.sceneManager.createElement("polyline", SVGPolylineElement);
            polyline.setAttributes(["points", points.join(" ")], ["stroke", Colour.White.toString()], ["stroke-width", `${CELL_SIZE / 4 + 2 * CONSTRAINT_OUTLINE_SIZE}`], ["stroke-linecap", "round"], ["stroke-linejoin", "round"], ["fill", "none"]);
            group.appendChild(polyline);
            const circle = this.sceneManager.createElement("circle", SVGCircleElement);
            circle.setAttributes(["cx", `${first.center.x}`], ["cy", `${first.center.y}`], ["r", `${CELL_SIZE * 2 / 5 + CONSTRAINT_OUTLINE_SIZE}`], ["stroke", "none"], ["fill", Colour.White.toString()]);
            group.appendChild(circle);
            graphic.set(RenderLayer.ConstraintOutlines, group);
        }
        // foreground
        {
            const group = this.sceneManager.createElement("g", SVGGElement);
            group.setAttribute("transform", `translate(${origin.left},${origin.top})`);
            const polyline = this.sceneManager.createElement("polyline", SVGPolylineElement);
            polyline.setAttributes(["points", points.join(" ")], ["stroke", Colour.LightGrey.toString()], ["stroke-width", `${CELL_SIZE / 4}`], ["stroke-linecap", "round"], ["stroke-linejoin", "round"], ["fill", "none"]);
            group.appendChild(polyline);
            const circle = this.sceneManager.createElement("circle", SVGCircleElement);
            circle.setAttributes(["cx", `${first.center.x}`], ["cy", `${first.center.y}`], ["r", `${CELL_SIZE * 2 / 5}`], ["stroke", "none"], ["fill", Colour.LightGrey.toString()]);
            group.appendChild(circle);
            graphic.set(RenderLayer.Constraints, group);
        }
        return graphic;
    }
}
