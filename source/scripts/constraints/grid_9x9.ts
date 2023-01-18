class Grid9x9Constraint extends IConstraint {
    regionConstraints: Array<RegionConstraint> = new Array();

    constructor(sceneManager: SceneManager, cell: Cell) {
        super(
            // cells
            (() => {
                let row = cell.i;
                let column = cell.j;

                // create list of cells that fall in the grid
                let cells: Array<Cell> = new Array(81);
                // create cell list
                for (let i = 0; i < 9; i++) {
                    for (let j = 0; j < 9; j++) {
                        cells[i*9 + j] = new Cell(row + i, column + j);
                    }
                }
                return cells;
            })(),
            // boundingBox
            new BoundingBox(cell.i, cell.j, 9, 9),
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
                        ["width", `${9 * CELL_SIZE}`],
                        ["height", `${9 * CELL_SIZE}`],
                        ["stroke", Colour.Black.toString()],
                        ["stroke-width", "2"],
                        ["fill", "none"]);
                    group.appendChild(rect);
                }
                // vertical rects
                {
                    let rect = sceneManager.createElement("rect", SVGRectElement);
                    rect.setAttributes(
                        ["width", `${3 * CELL_SIZE}`],
                        ["height", `${9 * CELL_SIZE}`],
                        ["stroke", Colour.Black.toString()],
                        ["stroke-width", "2"],
                        ["fill", "none"],
                        ["x", `${3 * CELL_SIZE}`],
                        ["y", "0"]);
                    group.appendChild(rect);
                }
                for (let k = 0; k < 3; k++) {
                    let rect = sceneManager.createElement("rect", SVGRectElement);
                    rect.setAttributes(
                        ["width", `${1 * CELL_SIZE}`],
                        ["height", `${9 * CELL_SIZE}`],
                        ["stroke", Colour.Black.toString()],
                        ["stroke-width", "1"],
                        ["fill", "none"],
                        ["x", `${(1 + k * 3) * CELL_SIZE}`],
                        ["y", "0"]);
                    group.appendChild(rect);
                }
                // horizontal rect
                {
                    let rect = sceneManager.createElement("rect", SVGRectElement);
                    rect.setAttributes(
                        ["width", `${9 * CELL_SIZE}`],
                        ["height", `${3 * CELL_SIZE}`],
                        ["stroke", Colour.Black.toString()],
                        ["stroke-width", "2"],
                        ["fill", "none"],
                        ["x", "0"],
                        ["y", `${3 * CELL_SIZE}`]);
                    group.appendChild(rect);
                }
                for (let k = 0; k < 3; k++) {
                    let rect = sceneManager.createElement("rect", SVGRectElement);
                    rect.setAttributes(
                        ["width", `${9 * CELL_SIZE}`],
                        ["height", `${1 * CELL_SIZE}`],
                        ["stroke", Colour.Black.toString()],
                        ["stroke-width", "1"],
                        ["fill", "none"],
                        ["x", "0"],
                        ["y", `${(1 + k * 3) * CELL_SIZE}`]);
                    group.appendChild(rect);
                }
                return group;
            })());

        const row = cell.i;
        const column = cell.j;

        // generate our list of constraints
        // rows
        for (let i = 0; i < 9; i++) {
            this.regionConstraints.push(RegionConstraint.RowRegion(new Cell(row + i, column), 9));
        }
        // columns
        for (let j = 0; j < 9; j++) {
            this.regionConstraints.push(RegionConstraint.ColumnRegion(new Cell(row, column + j), 9));
        }
        // squares
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                this.regionConstraints.push(RegionConstraint.SquareRegion(new Cell(row + 3*i, column + 3*j), 3));
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
}