"use strict";
class Grid8x8VerticalConstraint extends IConstraint {
    constructor(sceneManager, cell) {
        super(
        // cells
        (() => {
            let row = cell.i;
            let column = cell.j;
            // create list of cells that fall in the grid
            let cells = new Array(64);
            // create cell list
            for (let i = 0; i < 8; i++) {
                for (let j = 0; j < 8; j++) {
                    cells[i * 8 + j] = new Cell(row + i, column + j);
                }
            }
            return cells;
        })(), 
        // boundingBox
        new BoundingBox(cell.i, cell.j, 8, 8), 
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
                rect.setAttributes(["width", `${8 * CELL_SIZE}`], ["height", `${8 * CELL_SIZE}`], ["stroke", Colour.Black.toString()], ["stroke-width", `${GRID_BORDER_SIZE}`], ["fill", "none"]);
                group.appendChild(rect);
            }
            // horizontal rects
            {
                let rect = sceneManager.createElement("rect", SVGRectElement);
                rect.setAttributes(["width", `${4 * CELL_SIZE}`], ["height", `${8 * CELL_SIZE}`], ["stroke", Colour.Black.toString()], ["stroke-width", `${REGION_BORDER_SIZE}`], ["fill", "none"], ["x", `${2 * CELL_SIZE}`], ["y", "0"]);
                group.appendChild(rect);
            }
            {
                let rect = sceneManager.createElement("rect", SVGRectElement);
                rect.setAttributes(["width", `${2 * CELL_SIZE}`], ["height", `${8 * CELL_SIZE}`], ["stroke", Colour.Black.toString()], ["stroke-width", `${CELL_BORDER_SIZE}`], ["fill", "none"], ["x", `${1 * CELL_SIZE}`], ["y", "0"]);
                group.appendChild(rect);
            }
            {
                let rect = sceneManager.createElement("rect", SVGRectElement);
                rect.setAttributes(["width", `${2 * CELL_SIZE}`], ["height", `${8 * CELL_SIZE}`], ["stroke", Colour.Black.toString()], ["stroke-width", `${CELL_BORDER_SIZE}`], ["fill", "none"], ["x", `${5 * CELL_SIZE}`], ["y", "0"]);
                group.appendChild(rect);
            }
            // horizontal rects
            {
                let rect = sceneManager.createElement("rect", SVGRectElement);
                rect.setAttributes(["width", `${8 * CELL_SIZE}`], ["height", `${2 * CELL_SIZE}`], ["stroke", Colour.Black.toString()], ["stroke-width", `${CELL_BORDER_SIZE}`], ["fill", "none"], ["x", "0"], ["y", `${1 * CELL_SIZE}`]);
                group.appendChild(rect);
            }
            {
                let rect = sceneManager.createElement("rect", SVGRectElement);
                rect.setAttributes(["width", `${8 * CELL_SIZE}`], ["height", `${2 * CELL_SIZE}`], ["stroke", Colour.Black.toString()], ["stroke-width", `${CELL_BORDER_SIZE}`], ["fill", "none"], ["x", "0"], ["y", `${5 * CELL_SIZE}`]);
                group.appendChild(rect);
            }
            {
                let rect = sceneManager.createElement("rect", SVGRectElement);
                rect.setAttributes(["width", `${8 * CELL_SIZE}`], ["height", `${4 * CELL_SIZE}`], ["stroke", Colour.Black.toString()], ["stroke-width", `${CELL_BORDER_SIZE}`], ["fill", "none"], ["x", "0"], ["y", `${2 * CELL_SIZE}`]);
                group.appendChild(rect);
            }
            // cross
            {
                let horizontal = sceneManager.createElement("line", SVGLineElement);
                horizontal.setAttributes(["x1", "0"], ["x2", `${8 * CELL_SIZE}`], ["y1", `${4 * CELL_SIZE}`], ["y2", `${4 * CELL_SIZE}`], ["stroke", Colour.Black.toString()], ["stroke-width", `${REGION_BORDER_SIZE}`], ["fill", "none"]);
                group.appendChild(horizontal);
                let vertical = sceneManager.createElement("line", SVGLineElement);
                vertical.setAttributes(["x1", `${4 * CELL_SIZE}`], ["x2", `${4 * CELL_SIZE}`], ["y1", "0"], ["y2", `${8 * CELL_SIZE}`], ["stroke", Colour.Black.toString()], ["stroke-width", `${REGION_BORDER_SIZE}`], ["fill", "none"]);
                group.appendChild(vertical);
            }
            return group;
        })(), `grid-8x8-vertical-${Grid8x8VerticalConstraint.counter++}`);
        this.regionConstraints = new Array();
        const row = cell.i;
        const column = cell.j;
        // generate our list of constraints
        // rows
        for (let i = 0; i < 8; i++) {
            this.regionConstraints.push(RegionConstraint.RowRegion(new Cell(row + i, column), 8));
        }
        // columns
        for (let j = 0; j < 8; j++) {
            this.regionConstraints.push(RegionConstraint.ColumnRegion(new Cell(row, column + j), 8));
        }
        // regions
        for (let i = 0; i < 2; i++) {
            for (let j = 0; j < 4; j++) {
                this.regionConstraints.push(RegionConstraint.RectangleRegion(new Cell(row + 4 * i, column + 2 * j), 2, 4));
            }
        }
    }
    getViolatedCells(puzzleGrid) {
        let retval = new BSTSet();
        for (let constraint of this.regionConstraints) {
            retval = BSTSet.union(retval, constraint.getViolatedCells(puzzleGrid));
        }
        return retval;
    }
    translate(rows, columns) {
        for (let constraint of this.regionConstraints) {
            constraint.translate(rows, columns);
        }
        super.translate(rows, columns);
    }
}
Grid8x8VerticalConstraint.counter = 0;
