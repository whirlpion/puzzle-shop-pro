class Grid4x4Constraint extends IConstraint {
    private static counter: number = 0;
    regionConstraints: Array<RegionConstraint> = new Array();

    constructor(sceneManager: SceneManager, cell: Cell) {
        super(
            // cells
            (() => {
                let row = cell.i;
                let column = cell.j;

                // create list of cells that fall in the grid
                let cells: Array<Cell> = new Array(16);
                // create cell list
                for (let i = 0; i < 4; i++) {
                    for (let j = 0; j < 4; j++) {
                        cells[i*4 + j] = new Cell(row + i, column + j);
                    }
                }
                return cells;
            })(),
            // boundingBox
            new BoundingBox(cell.i, cell.j, 4, 4),
            // svg
            (() => {
                // generate the svg for this constraint
                let group = sceneManager.createElement("g", SVGGElement);

                let x = cell.j * CELL_SIZE;
                let y = cell.i * CELL_SIZE;
                group.setAttribute("transform", `translate(${x}, ${y})`);
                // the square
                {
                    let rect = sceneManager.createElement("rect", SVGRectElement);
                    rect.setAttributes(
                        ["width", `${4 * CELL_SIZE}`],
                        ["height", `${4 * CELL_SIZE}`],
                        ["stroke", Colour.Black.toString()],
                        ["stroke-width", `${GRID_BORDER_SIZE}`],
                        ["fill", "none"]);
                    group.appendChild(rect);
                }
                // vertical rect
                {
                    let rect = sceneManager.createElement("rect", SVGRectElement);
                    rect.setAttributes(
                        ["width", `${2 * CELL_SIZE}`],
                        ["height", `${4 * CELL_SIZE}`],
                        ["stroke", Colour.Black.toString()],
                        ["stroke-width", `${CELL_BORDER_SIZE}`],
                        ["fill", "none"],
                        ["x", `${1 * CELL_SIZE}`],
                        ["y", "0"]);
                    group.appendChild(rect);
                }
                // horizontal rect
                {
                    let rect = sceneManager.createElement("rect", SVGRectElement);
                    rect.setAttributes(
                        ["width", `${4 * CELL_SIZE}`],
                        ["height", `${2 * CELL_SIZE}`],
                        ["stroke", Colour.Black.toString()],
                        ["stroke-width", `${CELL_BORDER_SIZE}`],
                        ["fill", "none"],
                        ["x", "0"],
                        ["y", `${1 * CELL_SIZE}`]);
                    group.appendChild(rect);
                }
                // cross
                {
                    let horizontal = sceneManager.createElement("line", SVGLineElement);
                    horizontal.setAttributes(
                        ["x1", "0"],
                        ["x2", `${4 * CELL_SIZE}`],
                        ["y1", `${2 * CELL_SIZE}`],
                        ["y2", `${2 * CELL_SIZE}`],
                        ["stroke", Colour.Black.toString()],
                        ["stroke-width", `${REGION_BORDER_SIZE}`],
                        ["fill", "none"]);
                    group.appendChild(horizontal);

                    let vertical = sceneManager.createElement("line", SVGLineElement);
                    vertical.setAttributes(
                        ["x1", `${2 * CELL_SIZE}`],
                        ["x2", `${2 * CELL_SIZE}`],
                        ["y1", "0"],
                        ["y2", `${4 * CELL_SIZE}`],
                        ["stroke", Colour.Black.toString()],
                        ["stroke-width", `${REGION_BORDER_SIZE}`],
                        ["fill", "none"]);
                    group.appendChild(vertical);
                }
                return group;
            })(),
            `grid-4x4-${Grid4x4Constraint.counter++}`);

        const row = cell.i;
        const column = cell.j;

        // generate our list of constraints
        // rows
        for (let i = 0; i < 4; i++) {
            this.regionConstraints.push(RegionConstraint.RowRegion(new Cell(row + i, column), 4));
        }
        // columns
        for (let j = 0; j < 4; j++) {
            this.regionConstraints.push(RegionConstraint.ColumnRegion(new Cell(row, column + j), 4));
        }
        // squares
        for (let i = 0; i < 2; i++) {
            for (let j = 0; j < 2; j++) {
                this.regionConstraints.push(RegionConstraint.SquareRegion(new Cell(row + 2*i, column + 2*j), 2));
            }
        }
    }

    override getViolatedCells(puzzleGrid: PuzzleGrid): BSTSet<Cell> {
        let retval: BSTSet<Cell> = new BSTSet();
        for (let constraint of this.regionConstraints) {
            retval = BSTSet.union(retval,constraint.getViolatedCells(puzzleGrid));
        }
        return retval;
    }

    override translate(rows: number, columns: number): void {
        for (let constraint of this.regionConstraints) {
            constraint.translate(rows, columns);
        }

        super.translate(rows, columns);
    }
}