class BoundingBox {
    constructor(public i: number, public j: number, public rows: number, public columns: number) {
        this.i = i;
        this.j = j;
        this.rows = rows;
        this.columns = columns;
    }

    toString(): string {
        return `{ i: ${this.i}, j: ${this.j}, rows: ${this.rows}, columns: ${this.columns} }`;
    }

    static fromCells(first: Cell, ...cells: Cell[]) {
        let min_i = first.i;
        let min_j = first.j;
        let max_i = min_i;
        let max_j = min_j;

        for(let k = 1; k < cells.length; k++) {
            let cell = cells[k];
            min_i = Math.min(min_i, cell.i);
            max_i = Math.max(max_i, cell.i);
            min_j = Math.min(min_j, cell.j);
            max_j = Math.max(max_j, cell.j);
        }

        const i = min_i;
        const j = min_j;
        const rows = max_i - min_i + 1;
        const columns = max_j - min_j + 1;

        return new BoundingBox(i, j, rows, columns);
    }

    static union(boundingBoxes: BoundingBox[]): BoundingBox {
        return boundingBoxes.reduce((left, right) => {
            const i = Math.min(left.i, right.i);
            const j = Math.min(left.j, right.j);

            const rows = Math.max(left.i + left.rows, right.i + right.rows) - i;
            const columns = Math.max(left.j + left.columns, right.j + right.columns) - j;

            return new BoundingBox(i, j, rows, columns);
        });
    }
}