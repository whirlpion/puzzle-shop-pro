enum DirectionFlag {
    None = 0,
    North = 1 << 0,
    NorthEast = 1 << 1,
    East = 1 << 2,
    SouthEast = 1 << 3,
    South = 1 << 4,
    SouthWest = 1 << 5,
    West = 1 << 6,
    NorthWest = 1 << 7,
    All = North | NorthEast | East | SouthEast | South | SouthWest | West | NorthWest,
}

namespace DirectionFlag {
    export function neighborDirections<T>(cell: Cell, cellSet: BSTSet<Cell> | BSTMap<Cell, T>): DirectionFlag {

        let neighbors = DirectionFlag.None;
        if (cellSet.has(cell.northNeighbor)) neighbors |= DirectionFlag.North;
        if (cellSet.has(cell.northEastNeighbor)) neighbors |= DirectionFlag.NorthEast;
        if (cellSet.has(cell.eastNeighbor)) neighbors |= DirectionFlag.East;
        if (cellSet.has(cell.southEastNeighbor)) neighbors |= DirectionFlag.SouthEast;
        if (cellSet.has(cell.southNeighbor)) neighbors |= DirectionFlag.South;
        if (cellSet.has(cell.southWestNeighbor)) neighbors |= DirectionFlag.SouthWest;
        if (cellSet.has(cell.westNeighbor)) neighbors |= DirectionFlag.West;
        if (cellSet.has(cell.northWestNeighbor)) neighbors |= DirectionFlag.NorthWest;

        return neighbors;
    }
}

class SVGTileSet {
    private pathPrototypes: Array<[String, String]> = new Array();

    private sceneManager: SceneManager;

    // inset: pixels in orthogonally from the cell border to draw lines
    constructor(sceneManager: SceneManager, inset: number) {
        this.sceneManager = sceneManager;
        const SIZE = CELL_SIZE;
        const INSET = inset;

        for (let neighbors = 0; neighbors < 256; neighbors++) {
            // assumes we start from top left of a cell
            let d_stroke: string[] = new Array();
            let d_fill: string[] = new Array();
            // North-West Corner
            switch (neighbors & (DirectionFlag.West | DirectionFlag.NorthWest | DirectionFlag.North)) {
            case DirectionFlag.None:
            case DirectionFlag.NorthWest:
                d_stroke.push(`m ${INSET} ${SIZE/2} v ${-(SIZE/2 - INSET)} h ${SIZE/2 - INSET}`);
                d_fill.push(`m ${INSET} ${SIZE/2} v ${-(SIZE/2 - INSET)} h ${SIZE/2 - INSET}`);
                break;
            case DirectionFlag.West:
            case DirectionFlag.West | DirectionFlag.NorthWest:
                d_stroke.push(`m 0 ${INSET} h ${SIZE/2}`);
                d_fill.push(`m 0 ${SIZE/2} v ${-(SIZE/2 - INSET)} h ${SIZE/2}`);
                break;
            case DirectionFlag.North:
            case DirectionFlag.NorthWest | DirectionFlag.North:
                d_stroke.push(`m ${INSET} ${SIZE/2} v ${-SIZE/2} m ${SIZE/2 - INSET} 0`);
                d_fill.push(`m ${INSET} ${SIZE/2} v ${-SIZE/2} h ${SIZE/2 - INSET}`);
                break;
            case DirectionFlag.West | DirectionFlag.North:
                d_stroke.push(`m 0 ${INSET} h ${INSET} v ${-INSET} m ${SIZE/2 - INSET} 0`);
                d_fill.push(`m 0 ${SIZE/2} v ${-(SIZE/2 - INSET)} h ${INSET} v ${-INSET} h ${SIZE/2 - INSET}`);
                break;
            case DirectionFlag.West | DirectionFlag.NorthWest | DirectionFlag.North:
                d_stroke.push(`m ${SIZE/2} 0`);
                d_fill.push(`m 0 ${SIZE/2} v ${-SIZE/2} h ${SIZE/2}`);
                break;
            }

            // North-East Corner
            switch (neighbors & (DirectionFlag.North | DirectionFlag.NorthEast | DirectionFlag.East)) {
            case DirectionFlag.None:
            case DirectionFlag.NorthEast:
                d_stroke.push(`h ${SIZE/2 - INSET} v ${SIZE/2 - INSET}`);
                d_fill.push(`h ${SIZE/2 - INSET} v ${SIZE/2 - INSET}`);
                break;
            case DirectionFlag.North:
            case DirectionFlag.North | DirectionFlag.NorthEast:
                d_stroke.push(`m ${SIZE/2 - INSET} 0 v ${SIZE/2}`);
                d_fill.push(`h ${SIZE/2 - INSET} v ${SIZE/2}`);
                break;
            case DirectionFlag.East:
            case DirectionFlag.NorthEast | DirectionFlag.East:
                d_stroke.push(`h ${SIZE/2} m 0 ${SIZE/2 - INSET}`);
                d_fill.push(`h ${SIZE/2} v ${SIZE/2 - INSET}`);
                break;
            case DirectionFlag.North | DirectionFlag.East:
                d_stroke.push(`m ${SIZE/2-INSET} 0 v ${INSET} h ${INSET} m 0 ${SIZE/2 -INSET}`);
                d_fill.push(`h ${SIZE/2 - INSET} v ${INSET} h ${INSET} v ${SIZE/2 - INSET}`);
                break;
            case DirectionFlag.North | DirectionFlag.NorthEast | DirectionFlag.East:
                d_stroke.push(`m ${SIZE/2} ${SIZE/2}`);
                d_fill.push(`h ${SIZE/2} v ${SIZE/2}`);
                break;
            }

            // South-East Corner
            switch (neighbors & (DirectionFlag.East | DirectionFlag.SouthEast | DirectionFlag.South)) {
            case DirectionFlag.None:
            case DirectionFlag.SouthEast:
                d_stroke.push(`v ${SIZE/2 - INSET} h ${-(SIZE/2 - INSET)}`);
                d_fill.push(`v ${SIZE/2 - INSET} h ${-(SIZE/2 - INSET)}`);
                break;
            case DirectionFlag.East:
            case DirectionFlag.East | DirectionFlag.SouthEast:
                d_stroke.push(`m 0 ${SIZE/2 - INSET} h ${-SIZE/2}`);
                d_fill.push(`v ${SIZE/2 - INSET} h ${-SIZE/2}`);
                break;
            case DirectionFlag.South:
            case DirectionFlag.SouthEast | DirectionFlag.South:
                d_stroke.push(`v ${SIZE/2} m ${-(SIZE/2 - INSET)} 0`);
                d_fill.push(`v ${SIZE/2} h ${-(SIZE/2 - INSET)}`);
                break;
            case DirectionFlag.East | DirectionFlag.South:
                d_stroke.push(`m 0 ${SIZE/2 - INSET} h ${-INSET} v ${INSET} m ${-(SIZE/2 - INSET)} 0`);
                d_fill.push(`v ${SIZE/2 - INSET} h ${-INSET} v ${INSET} h ${-(SIZE/2 - INSET)}`);
                break;
            case DirectionFlag.East | DirectionFlag.SouthEast | DirectionFlag.South:
                d_stroke.push(`m ${-SIZE/2} ${SIZE/2}`);
                d_fill.push(`v ${SIZE/2} h ${-SIZE/2}`);
                break;
            }

            // South-West Corner
            switch (neighbors & (DirectionFlag.South | DirectionFlag.SouthWest | DirectionFlag.West)) {
            case DirectionFlag.None:
            case DirectionFlag.SouthWest:
                d_stroke.push(`h ${-(SIZE/2 - INSET)} v ${-(SIZE/2 - INSET)}`);
                d_fill.push(`h ${-(SIZE/2 - INSET)} `);
                break;
            case DirectionFlag.South:
            case DirectionFlag.South | DirectionFlag.SouthWest:
                d_stroke.push(`m ${-(SIZE/2 - INSET)} 0 v ${-SIZE/2}`);
                d_fill.push(`h ${-(SIZE/2 - INSET)}`);
                break;
            case DirectionFlag.West:
            case DirectionFlag.SouthWest | DirectionFlag.West:
                d_stroke.push(`h ${-SIZE/2}`);
                d_fill.push(`h ${-SIZE/2}`);
                break;
            case DirectionFlag.South | DirectionFlag.West:
                d_stroke.push(`m ${-(SIZE/2 - INSET)} 0 v ${-INSET} h ${-INSET}`);
                d_fill.push(`h ${-(SIZE/2 - INSET)} v ${-INSET} h ${-INSET}`);
                break;
            case DirectionFlag.South | DirectionFlag.SouthWest | DirectionFlag.West:
                d_fill.push(`h ${-SIZE/2}`);
                break;
            }
            this.pathPrototypes.push([d_stroke.join(" "), d_fill.join(" ")]);
        }
    }

    getEdge(cell: Cell, neighbors: DirectionFlag): SVGPathElement {
        let [d_stroke, _d_fill] = this.pathPrototypes[neighbors];

        let path = this.sceneManager.createElement<SVGPathElement>("path", SVGPathElement);
        path.setAttributes(
            ["d", `M ${cell.left} ${cell.top} ${d_stroke}`],
            ["fill", "none"]);
        return path;
    }

    getFill(cell: Cell, neighbors: DirectionFlag): SVGPathElement {
        let [_d_stroke, d_fill] = this.pathPrototypes[neighbors];

        let path = this.sceneManager.createElement<SVGPathElement>("path", SVGPathElement);
        path.setAttributes(
            ["d", `M ${cell.left} ${cell.top} ${d_fill}`],
            ["stroke", "none"]);
        return path;
    }
}
