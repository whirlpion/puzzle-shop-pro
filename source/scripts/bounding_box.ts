class BoundingBox {
    public readonly i: number;
    public readonly j: number;
    public readonly rows: number;
    public readonly columns: number;

    public static readonly Empty: BoundingBox = new BoundingBox(0,0,0,0);

    constructor(i: number, j: number, rows: number, columns: number) {
        throwIfFalse(Number.isInteger(i));
        throwIfFalse(Number.isInteger(j));
        throwIfFalse(Number.isInteger(rows));
        throwIfFalse(Number.isInteger(columns));

        this.i = i;
        this.j = j;
        this.rows = rows;
        this.columns = columns;
    }

    get left(): number {
        return this.j;
    }

    get right(): number {
        return this.j + this.columns - 1;
    }

    get top(): number {
        return this.i;
    }

    get bottom(): number {
        return this.i + this.rows - 1;
    }

    toString(): string {
        return `{ i: ${this.i}, j: ${this.j}, rows: ${this.rows}, columns: ${this.columns} }`;
    }

    cellInBox(cell: Cell) : boolean {
        return (cell.i >= this.top && cell.i <= this.bottom) &&
               (cell.j >= this.left && cell.j <= this.right);
    }

    static fromCells(...cells: Cell[]) {
        const first = cells.first();
        throwIfUndefined(first);

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

    static union(...boundingBoxes: BoundingBox[]): BoundingBox {
        throwIfEmpty(boundingBoxes);
        return boundingBoxes.reduce((left, right) => {
            const i = Math.min(left.i, right.i);
            const j = Math.min(left.j, right.j);

            const rows = Math.max(left.i + left.rows, right.i + right.rows) - i;
            const columns = Math.max(left.j + left.columns, right.j + right.columns) - j;

            return new BoundingBox(i, j, rows, columns);
        });
    }
}