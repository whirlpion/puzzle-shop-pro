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
class SVGTileSet {
    // inset: pixels in orthogonally from the cell border to draw lines
    constructor(sceneManager, inset) {
        this.pathPrototypes = new Array();
        this.sceneManager = sceneManager;
        const SIZE = CELL_SIZE;
        const INSET = inset;
        for (let neighbors = 0; neighbors < 256; neighbors++) {
            // assumes we start from top left of a cell
            let d = "";
            // North-West Corner
            switch (neighbors & (DirectionFlag.West | DirectionFlag.NorthWest | DirectionFlag.North)) {
                case DirectionFlag.None:
                    d += `m ${INSET} ${SIZE / 2} v ${-(SIZE / 2 - INSET)} h ${SIZE / 2 - INSET} m ${-SIZE / 2} ${-INSET} `;
                    break;
                case DirectionFlag.West:
                    d += `m 0 ${INSET} h ${SIZE / 2} m ${-SIZE / 2} ${-INSET} `;
                    break;
                case DirectionFlag.NorthWest:
                    d += `m ${INSET} ${SIZE / 2} v ${-(SIZE / 2 - INSET)} h ${SIZE / 2 - INSET} m ${-SIZE / 2} ${-INSET} `;
                    break;
                case DirectionFlag.West | DirectionFlag.NorthWest:
                    d += `m 0 ${INSET} h ${SIZE / 2} m ${-SIZE / 2} ${-INSET} `;
                    break;
                case DirectionFlag.North:
                    d += `m ${INSET} ${SIZE / 2} v ${-SIZE / 2} m ${-INSET} 0 `;
                    break;
                case DirectionFlag.West | DirectionFlag.North:
                    d += `m ${INSET} 0 v 0 ${INSET} h ${-INSET} 0 m 0 ${-INSET}`;
                    break;
                case DirectionFlag.NorthWest | DirectionFlag.North:
                    d += `m ${INSET} ${SIZE / 2} v ${-SIZE / 2} m ${-INSET} 0 `;
                    break;
                case DirectionFlag.West | DirectionFlag.NorthWest | DirectionFlag.North: break;
            }
            // North-East Corner
            switch (neighbors & (DirectionFlag.North | DirectionFlag.NorthEast | DirectionFlag.East)) {
                case DirectionFlag.None:
                    d += `m ${SIZE / 2} ${INSET} h ${SIZE / 2 - INSET} v ${SIZE / 2 - INSET} m ${-(SIZE - INSET)} ${-SIZE / 2} `;
                    break;
                case DirectionFlag.North:
                    d += `m ${SIZE - INSET} 0 v ${SIZE / 2} m ${-(SIZE - INSET)} ${-SIZE / 2} `;
                    break;
                case DirectionFlag.NorthEast:
                    d += `m ${SIZE / 2} ${INSET} h ${SIZE / 2 - INSET} v ${SIZE / 2 - INSET} m ${-(SIZE - INSET)} ${-SIZE / 2} `;
                    break;
                case DirectionFlag.North | DirectionFlag.NorthEast:
                    d += `m ${SIZE - INSET} 0 v ${SIZE / 2} m ${-(SIZE - INSET)} ${-SIZE / 2} `;
                    break;
                case DirectionFlag.East:
                    d += `m ${SIZE / 2} ${INSET} h ${SIZE / 2} m ${-SIZE} ${-INSET} `;
                    break;
                case DirectionFlag.North | DirectionFlag.East:
                    d += `m ${SIZE - INSET} 0 v ${INSET} h ${INSET} m ${-SIZE} ${-INSET} `;
                    break;
                case DirectionFlag.NorthEast | DirectionFlag.East:
                    d += `m ${SIZE / 2} ${INSET} h ${SIZE / 2} m ${-SIZE} ${-INSET} `;
                    break;
                case DirectionFlag.North | DirectionFlag.NorthEast | DirectionFlag.East: break;
            }
            // South-East Corner
            switch (neighbors & (DirectionFlag.East | DirectionFlag.SouthEast | DirectionFlag.South)) {
                case DirectionFlag.None:
                    d += `m ${SIZE - INSET} ${SIZE / 2} v ${SIZE / 2 - INSET} h ${-(SIZE / 2 - INSET)} m ${-SIZE / 2} ${-(SIZE - INSET)} `;
                    break;
                case DirectionFlag.East:
                    d += `m ${SIZE / 2} ${SIZE - INSET} h ${SIZE / 2} m ${-SIZE} ${-(SIZE - INSET)} `;
                    break;
                case DirectionFlag.SouthEast:
                    d += `m ${SIZE - INSET} ${SIZE / 2} v ${SIZE / 2 - INSET} h ${-(SIZE / 2 - INSET)} m ${-SIZE / 2} ${-(SIZE - INSET)} `;
                    break;
                case DirectionFlag.East | DirectionFlag.SouthEast:
                    d += `m ${SIZE / 2} ${SIZE - INSET} h ${SIZE / 2} m ${-SIZE} ${-(SIZE - INSET)} `;
                    break;
                case DirectionFlag.South:
                    d += `m ${SIZE - INSET} ${SIZE / 2} v ${SIZE / 2} m ${-(SIZE - INSET)} ${-SIZE} `;
                    break;
                case DirectionFlag.East | DirectionFlag.South:
                    d += `m ${SIZE} ${SIZE - INSET} h ${-INSET} v ${INSET} m ${-(SIZE - INSET)} ${-SIZE}`;
                    break;
                case DirectionFlag.SouthEast | DirectionFlag.South:
                    d += `m ${SIZE - INSET} ${SIZE / 2} v ${SIZE / 2} m ${-(SIZE - INSET)} ${-SIZE} `;
                    break;
                case DirectionFlag.East | DirectionFlag.SouthEast | DirectionFlag.South: break;
            }
            // South-West Corner
            switch (neighbors & (DirectionFlag.South | DirectionFlag.SouthWest | DirectionFlag.West)) {
                case DirectionFlag.None:
                    d += `m ${INSET} ${SIZE / 2} v ${SIZE / 2 - INSET} h ${SIZE / 2 - INSET} m ${SIZE / 2} ${-(SIZE - INSET)} `;
                    break;
                case DirectionFlag.South:
                    d += `m ${INSET} ${SIZE / 2} v ${SIZE / 2} m ${-INSET} ${-SIZE} `;
                    break;
                case DirectionFlag.SouthWest:
                    d += `m ${INSET} ${SIZE / 2} v ${SIZE / 2 - INSET} h ${SIZE / 2 - INSET} m ${-SIZE / 2} ${-(SIZE - INSET)} `;
                    break;
                case DirectionFlag.South | DirectionFlag.SouthWest:
                    d += `m ${INSET} ${SIZE / 2} v ${SIZE / 2} m ${-INSET} ${-SIZE} `;
                    break;
                case DirectionFlag.West:
                    d += `m ${SIZE / 2} ${SIZE - INSET} h ${-(SIZE / 2)} m 0 ${-(SIZE - INSET)} `;
                    break;
                case DirectionFlag.South | DirectionFlag.West:
                    d += `m ${INSET} ${SIZE} v ${-INSET} h ${-INSET} m 0 ${-(SIZE - INSET)} `;
                    break;
                    ;
                case DirectionFlag.SouthWest | DirectionFlag.West:
                    d += `m ${SIZE / 2} ${SIZE - INSET} h ${-SIZE / 2} m 0 ${-(SIZE - INSET)} `;
                    break;
                case DirectionFlag.South | DirectionFlag.SouthWest | DirectionFlag.West: break;
            }
            this.pathPrototypes.push(d.trim());
        }
    }
    getTile(cell, neighbors) {
        let d = this.pathPrototypes[neighbors];
        let path = this.sceneManager.createElement("path", SVGPathElement);
        path.setAttribute("d", `M ${cell.left} ${cell.top} ${d}`);
        // path.setAttributes(
        //     // prepend with absolute position of top left of cell
        //     ["d", `M ${cell.left} ${cell.top} ${d}`],
        //     ["fill", "none"],
        //     ["stroke", "skyblue"],
        //     ["stroke-width", "24px"]);
        return path;
    }
}
