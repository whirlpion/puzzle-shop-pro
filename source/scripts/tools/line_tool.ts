type LineType = "thermo";

const LINE_THERMO: LineType = "thermo";

class LineTool extends ITool {
    lineType: LineType = LINE_THERMO;

    drawingLine: boolean = false;
    cellsInLine: Array<Cell> = new Array();
    graphic: Map<RenderLayer, SVGGElement> = new Map();


    constructor(toolBox: ToolBox, puzzleGrid: PuzzleGrid, actionStack: UndoRedoStack, sceneManager: SceneManager) {
        super(toolBox, puzzleGrid, actionStack, sceneManager)
    }

    get mode(): ToolMode {
        return ToolMode.ConstraintInsert;
    }

    override get toolSettings(): Map<string, Setting> {
        const retval: Map<string, Setting> = new Map();
        retval.set("Type", new SettingOption([
                    [LINE_THERMO, "Thermo"]
                ], this.lineType, (value: string): void => {
                    this.lineType = <LineType>value;
                    console.log(`line type: ${this.lineType}`);
                }));
        return retval;
    }

    override handleMouseClick(_event: MouseEvent): boolean {
        return false;
    }

    override handleMouseDown(event: MouseEvent): boolean {
        if (event.primaryButton) {
            this.cellsInLine = new Array();
            const cell = this.sceneManager.cellAtMouseEvent(event);
            this.cellsInLine.push(cell);
            this.drawingLine = true;

            for (let svg of this.graphic.values()) {
                this.sceneManager.removeElement(svg);
            }
            this.graphic = this.drawLine(this.cellsInLine);
            for (let [layer, svg] of this.graphic) {
                this.sceneManager.addElement(svg, layer);
            }

            return true;
        }
        return false;
    }

    override handleMouseUp(event: MouseEvent): boolean {
        if (!event.primaryButton && this.drawingLine) {
            console.log("cells: ", this.cellsInLine);
            this.drawingLine = false;

            for (let svg of this.graphic.values()) {
                this.sceneManager.removeElement(svg);
            }

            if (this.cellsInLine.length > 1) {
                let lineConstraint = new ThermoConstraint(this.cellsInLine, this.graphic);
                let action = new InsertConstraintAction(this.puzzleGrid, this.sceneManager, lineConstraint);
                this.actionStack.doAction(action);
            }

            this.graphic = new Map();

            return true;
        }
        return false;
    }

    // this needs to handle laggy movement, going through diagonals, etc
    override handleMouseMove(event: MouseEvent): boolean {
        if (event.primaryButton && this.drawingLine) {
            const newCell = this.sceneManager.cellAtMouseEvent(event);
            const prevCell = this.cellsInLine.last();
            throwIfNotType<Cell>(prevCell, Cell);
            if (prevCell.equals(newCell)) {
                return false;
            } else {
                if (prevCell.adjacentKingsMove(newCell)) {
                    const nearCenter = this.sceneManager.mouseEventNearCellCenter(event);
                    if (nearCenter) {
                        this.cellsInLine.push(newCell);
                    } else {
                        return false;
                    }
                } else {
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

            let middle = 1;  // middle of proposed palindrome

            const cil = this.cellsInLine;
            while (middle < cil.length - 1) {
                let extent = 1;  // extent of proposed palindrome
                let palindromeFound = false;
                do {
                    // palindrome canidate bounds
                    const left = middle - extent;
                    const right = middle + extent;
                    if (left >= 0 && right < cil.length &&
                        cil.isPalindrome(left, right - left + 1)) {
                        palindromeFound = true;
                        extent++;
                    } else {
                        extent--;
                        break;
                    }
                } while (true);

                if (palindromeFound) {
                    cil.splice(middle - extent, 2*extent);
                    middle = 1;
                } else {
                    middle++;
                }
            }

            for (let svg of this.graphic.values()) {
                this.sceneManager.removeElement(svg);
            }
            this.graphic = this.drawLine(this.cellsInLine);
            for (let [layer, svg] of this.graphic) {
                this.sceneManager.addElement(svg, layer);
            }

            return true;
        }
        return false;
    }

    private drawLine(cells: Array<Cell>): Map<RenderLayer, SVGGElement> {
        let boundingBox = BoundingBox.fromCells(...cells);
        const origin = new Cell(boundingBox.top, boundingBox.left);

        let first = cells.first();
        throwIfUndefined(first);
        first = new Cell(first.i - origin.i, first.j - origin.j);

        // generate points for polyline
        const points = new Array<string>();
        for (let cell of cells) {
            // normalize points on our first cell
            const normCell = new Cell(cell.i - origin.i, cell.j - origin.j);
            const point = normCell.center;
            points.push(`${point.x},${point.y}`);
        }

        let retval: Map<RenderLayer, SVGGElement> = new Map();

        // outline
        {
            const group = this.sceneManager.createElement("g", SVGGElement);
            group.setAttribute("transform", `translate(${origin.left},${origin.top})`);
            const polyline = this.sceneManager.createElement("polyline", SVGPolylineElement);
            polyline.setAttributes(
                ["points", points.join(" " )],
                ["stroke", Colour.White.toString()],
                ["stroke-width", `${CELL_SIZE / 4 + 2 * CONSTRAINT_OUTLINE_SIZE}`],
                ["stroke-linecap", "round"],
                ["stroke-linejoin", "round"],
                ["fill", "none"]);
            group.appendChild(polyline);
            const circle = this.sceneManager.createElement("circle", SVGCircleElement);
            circle.setAttributes(
                ["cx", `${first.center.x}`],
                ["cy", `${first.center.y}`],
                ["r", `${CELL_SIZE * 2/5 + CONSTRAINT_OUTLINE_SIZE}`],
                ["stroke", "none"],
                ["fill", Colour.White.toString()],
                );
            group.appendChild(circle);
            retval.set(RenderLayer.ConstraintOutlines, group);
        }
        // foreground
        {
            const group = this.sceneManager.createElement("g", SVGGElement);
            group.setAttribute("transform", `translate(${origin.left},${origin.top})`);
            const polyline = this.sceneManager.createElement("polyline", SVGPolylineElement);
            polyline.setAttributes(
                ["points", points.join(" " )],
                ["stroke", Colour.LightGrey.toString()],
                ["stroke-width", `${CELL_SIZE / 4}`],
                ["stroke-linecap", "round"],
                ["stroke-linejoin", "round"],
                ["fill", "none"]);
            group.appendChild(polyline);
            const circle = this.sceneManager.createElement("circle", SVGCircleElement);
            circle.setAttributes(
                ["cx", `${first.center.x}`],
                ["cy", `${first.center.y}`],
                ["r", `${CELL_SIZE * 2/5 }`],
                ["stroke", "none"],
                ["fill", Colour.LightGrey.toString()],
                );
            group.appendChild(circle);
            retval.set(RenderLayer.Constraints, group);
        }

        return retval;
    }
}