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