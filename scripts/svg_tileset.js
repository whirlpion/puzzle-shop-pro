"use strict";
var DirectionFlag;
(function (DirectionFlag) {
    DirectionFlag[DirectionFlag["None"] = 0] = "None";
    DirectionFlag[DirectionFlag["North"] = 1] = "North";
    DirectionFlag[DirectionFlag["NorthEast"] = 2] = "NorthEast";
    DirectionFlag[DirectionFlag["East"] = 4] = "East";
    DirectionFlag[DirectionFlag["SouthEast"] = 8] = "SouthEast";
    DirectionFlag[DirectionFlag["South"] = 16] = "South";
    DirectionFlag[DirectionFlag["SouthWest"] = 32] = "SouthWest";
    DirectionFlag[DirectionFlag["West"] = 64] = "West";
    DirectionFlag[DirectionFlag["NorthWest"] = 128] = "NorthWest";
    DirectionFlag[DirectionFlag["All"] = 255] = "All";
})(DirectionFlag || (DirectionFlag = {}));
(function (DirectionFlag) {
    function neighborDirections(cell, cellSet) {
        let neighbors = DirectionFlag.None;
        if (cellSet.has(cell.northNeighbor))
            neighbors |= DirectionFlag.North;
        if (cellSet.has(cell.northEastNeighbor))
            neighbors |= DirectionFlag.NorthEast;
        if (cellSet.has(cell.eastNeighbor))
            neighbors |= DirectionFlag.East;
        if (cellSet.has(cell.southEastNeighbor))
            neighbors |= DirectionFlag.SouthEast;
        if (cellSet.has(cell.southNeighbor))
            neighbors |= DirectionFlag.South;
        if (cellSet.has(cell.southWestNeighbor))
            neighbors |= DirectionFlag.SouthWest;
        if (cellSet.has(cell.westNeighbor))
            neighbors |= DirectionFlag.West;
        if (cellSet.has(cell.northWestNeighbor))
            neighbors |= DirectionFlag.NorthWest;
        return neighbors;
    }
    DirectionFlag.neighborDirections = neighborDirections;
})(DirectionFlag || (DirectionFlag = {}));
class SVGTileSet {
    static getEdge(cell, neighbors, inset, sceneManager) {
        let d_stroke = new Array();
        const INSET = inset;
        // North-West Corner
        switch (neighbors & (DirectionFlag.West | DirectionFlag.NorthWest | DirectionFlag.North)) {
            case DirectionFlag.None:
            case DirectionFlag.NorthWest:
                d_stroke.push(`m ${INSET} ${HALF_CELL_SIZE} v -${HALF_CELL_SIZE - INSET} h ${HALF_CELL_SIZE - INSET}`);
                break;
            case DirectionFlag.West:
            case DirectionFlag.West | DirectionFlag.NorthWest:
                d_stroke.push(`m 0 ${INSET} h ${HALF_CELL_SIZE}`);
                break;
            case DirectionFlag.North:
            case DirectionFlag.NorthWest | DirectionFlag.North:
                d_stroke.push(`m ${INSET} ${HALF_CELL_SIZE} v -${HALF_CELL_SIZE} m ${HALF_CELL_SIZE - INSET} 0`);
                break;
            case DirectionFlag.West | DirectionFlag.North:
                d_stroke.push(`m 0 ${INSET} h ${INSET} v ${-INSET} m ${HALF_CELL_SIZE - INSET} 0`);
                break;
            case DirectionFlag.West | DirectionFlag.NorthWest | DirectionFlag.North:
                d_stroke.push(`m ${HALF_CELL_SIZE} 0`);
                break;
        }
        // North-East Corner
        switch (neighbors & (DirectionFlag.North | DirectionFlag.NorthEast | DirectionFlag.East)) {
            case DirectionFlag.None:
            case DirectionFlag.NorthEast:
                d_stroke.push(`h ${HALF_CELL_SIZE - INSET} v ${HALF_CELL_SIZE - INSET}`);
                break;
            case DirectionFlag.North:
            case DirectionFlag.North | DirectionFlag.NorthEast:
                d_stroke.push(`m ${HALF_CELL_SIZE - INSET} 0 v ${HALF_CELL_SIZE}`);
                break;
            case DirectionFlag.East:
            case DirectionFlag.NorthEast | DirectionFlag.East:
                d_stroke.push(`h ${HALF_CELL_SIZE} m 0 ${HALF_CELL_SIZE - INSET}`);
                break;
            case DirectionFlag.North | DirectionFlag.East:
                d_stroke.push(`m ${HALF_CELL_SIZE - INSET} 0 v ${INSET} h ${INSET} m 0 ${HALF_CELL_SIZE - INSET}`);
                break;
            case DirectionFlag.North | DirectionFlag.NorthEast | DirectionFlag.East:
                d_stroke.push(`m ${HALF_CELL_SIZE} ${HALF_CELL_SIZE}`);
                break;
        }
        // South-East Corner
        switch (neighbors & (DirectionFlag.East | DirectionFlag.SouthEast | DirectionFlag.South)) {
            case DirectionFlag.None:
            case DirectionFlag.SouthEast:
                d_stroke.push(`v ${HALF_CELL_SIZE - INSET} h -${HALF_CELL_SIZE - INSET}`);
                break;
            case DirectionFlag.East:
            case DirectionFlag.East | DirectionFlag.SouthEast:
                d_stroke.push(`m 0 ${HALF_CELL_SIZE - INSET} h ${-HALF_CELL_SIZE}`);
                break;
            case DirectionFlag.South:
            case DirectionFlag.SouthEast | DirectionFlag.South:
                d_stroke.push(`v ${HALF_CELL_SIZE} m -${HALF_CELL_SIZE - INSET} 0`);
                break;
            case DirectionFlag.East | DirectionFlag.South:
                d_stroke.push(`m 0 ${HALF_CELL_SIZE - INSET} h -${INSET} v ${INSET} m -${HALF_CELL_SIZE - INSET} 0`);
                break;
            case DirectionFlag.East | DirectionFlag.SouthEast | DirectionFlag.South:
                d_stroke.push(`m -${HALF_CELL_SIZE} ${HALF_CELL_SIZE}`);
                break;
        }
        // South-West Corner
        switch (neighbors & (DirectionFlag.South | DirectionFlag.SouthWest | DirectionFlag.West)) {
            case DirectionFlag.None:
            case DirectionFlag.SouthWest:
                d_stroke.push(`h -${HALF_CELL_SIZE - INSET} v -${HALF_CELL_SIZE - INSET}`);
                break;
            case DirectionFlag.South:
            case DirectionFlag.South | DirectionFlag.SouthWest:
                d_stroke.push(`m -${HALF_CELL_SIZE - INSET} 0 v -${HALF_CELL_SIZE}`);
                break;
            case DirectionFlag.West:
            case DirectionFlag.SouthWest | DirectionFlag.West:
                d_stroke.push(`h -${HALF_CELL_SIZE}`);
                break;
            case DirectionFlag.South | DirectionFlag.West:
                d_stroke.push(`m -${HALF_CELL_SIZE - INSET} 0 v -${INSET} h -${INSET}`);
                break;
            case DirectionFlag.South | DirectionFlag.SouthWest | DirectionFlag.West:
                break;
        }
        let path = sceneManager.createElement("path", SVGPathElement);
        path.setAttributes(["d", `M ${cell.left} ${cell.top} ${d_stroke.join(" ")}`], ["fill", "none"]);
        return path;
    }
    static getFill(cell, neighbors, inset, sceneManager) {
        let d_fill = new Array();
        const INSET = inset;
        // North-West Corner
        switch (neighbors & (DirectionFlag.West | DirectionFlag.NorthWest | DirectionFlag.North)) {
            case DirectionFlag.None:
            case DirectionFlag.NorthWest:
                d_fill.push(`m ${INSET} ${HALF_CELL_SIZE} v -${HALF_CELL_SIZE - INSET} h ${HALF_CELL_SIZE - INSET}`);
                break;
            case DirectionFlag.West:
            case DirectionFlag.West | DirectionFlag.NorthWest:
                d_fill.push(`m 0 ${HALF_CELL_SIZE} v -${HALF_CELL_SIZE - INSET} h ${HALF_CELL_SIZE}`);
                break;
            case DirectionFlag.North:
            case DirectionFlag.NorthWest | DirectionFlag.North:
                d_fill.push(`m ${INSET} ${HALF_CELL_SIZE} v -${HALF_CELL_SIZE} h ${HALF_CELL_SIZE - INSET}`);
                break;
            case DirectionFlag.West | DirectionFlag.North:
                d_fill.push(`m 0 ${HALF_CELL_SIZE} v -${HALF_CELL_SIZE - INSET} h ${INSET} v -${INSET} h ${HALF_CELL_SIZE - INSET}`);
                break;
            case DirectionFlag.West | DirectionFlag.NorthWest | DirectionFlag.North:
                d_fill.push(`m 0 ${HALF_CELL_SIZE} v -${HALF_CELL_SIZE} h ${HALF_CELL_SIZE}`);
                break;
        }
        // North-East Corner
        switch (neighbors & (DirectionFlag.North | DirectionFlag.NorthEast | DirectionFlag.East)) {
            case DirectionFlag.None:
            case DirectionFlag.NorthEast:
                d_fill.push(`h ${HALF_CELL_SIZE - INSET} v ${HALF_CELL_SIZE - INSET}`);
                break;
            case DirectionFlag.North:
            case DirectionFlag.North | DirectionFlag.NorthEast:
                d_fill.push(`h ${HALF_CELL_SIZE - INSET} v ${HALF_CELL_SIZE}`);
                break;
            case DirectionFlag.East:
            case DirectionFlag.NorthEast | DirectionFlag.East:
                d_fill.push(`h ${HALF_CELL_SIZE} v ${HALF_CELL_SIZE - INSET}`);
                break;
            case DirectionFlag.North | DirectionFlag.East:
                d_fill.push(`h ${HALF_CELL_SIZE - INSET} v ${INSET} h ${INSET} v ${HALF_CELL_SIZE - INSET}`);
                break;
            case DirectionFlag.North | DirectionFlag.NorthEast | DirectionFlag.East:
                d_fill.push(`h ${HALF_CELL_SIZE} v ${HALF_CELL_SIZE}`);
                break;
        }
        // South-East Corner
        switch (neighbors & (DirectionFlag.East | DirectionFlag.SouthEast | DirectionFlag.South)) {
            case DirectionFlag.None:
            case DirectionFlag.SouthEast:
                d_fill.push(`v ${HALF_CELL_SIZE - INSET} h -${HALF_CELL_SIZE - INSET}`);
                break;
            case DirectionFlag.East:
            case DirectionFlag.East | DirectionFlag.SouthEast:
                d_fill.push(`v ${HALF_CELL_SIZE - INSET} h -${HALF_CELL_SIZE}`);
                break;
            case DirectionFlag.South:
            case DirectionFlag.SouthEast | DirectionFlag.South:
                d_fill.push(`v ${HALF_CELL_SIZE} h -${HALF_CELL_SIZE - INSET}`);
                break;
            case DirectionFlag.East | DirectionFlag.South:
                d_fill.push(`v ${HALF_CELL_SIZE - INSET} h -${INSET} v ${INSET} h -${HALF_CELL_SIZE - INSET}`);
                break;
            case DirectionFlag.East | DirectionFlag.SouthEast | DirectionFlag.South:
                d_fill.push(`v ${HALF_CELL_SIZE} h -${HALF_CELL_SIZE}`);
                break;
        }
        // South-West Corner
        switch (neighbors & (DirectionFlag.South | DirectionFlag.SouthWest | DirectionFlag.West)) {
            case DirectionFlag.None:
            case DirectionFlag.SouthWest:
                d_fill.push(`h -${HALF_CELL_SIZE - INSET} `);
                break;
            case DirectionFlag.South:
            case DirectionFlag.South | DirectionFlag.SouthWest:
                d_fill.push(`h -${HALF_CELL_SIZE - INSET}`);
                break;
            case DirectionFlag.West:
            case DirectionFlag.SouthWest | DirectionFlag.West:
                d_fill.push(`h -${HALF_CELL_SIZE}`);
                break;
            case DirectionFlag.South | DirectionFlag.West:
                d_fill.push(`h -${HALF_CELL_SIZE - INSET} v -${INSET} h -${INSET}`);
                break;
            case DirectionFlag.South | DirectionFlag.SouthWest | DirectionFlag.West:
                d_fill.push(`h -${HALF_CELL_SIZE}`);
                break;
        }
        let path = sceneManager.createElement("path", SVGPathElement);
        path.setAttributes(["d", `M ${cell.left} ${cell.top} ${d_fill.join(" ")}`], ["stroke", "none"]);
        return path;
    }
}
