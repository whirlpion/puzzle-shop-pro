"use strict";
var RenderLayer;
(function (RenderLayer) {
    // the very back layer
    RenderLayer[RenderLayer["Bottom"] = 0] = "Bottom";
    // background colour
    RenderLayer[RenderLayer["Fill"] = 1] = "Fill";
    // puzzle grids
    RenderLayer[RenderLayer["Grid"] = 2] = "Grid";
    // constraints to go on top of the grid
    RenderLayer[RenderLayer["Constraints"] = 3] = "Constraints";
    // user entered digits, pencil marks, etc
    RenderLayer[RenderLayer["PencilMark"] = 4] = "PencilMark";
    // render on top
    RenderLayer[RenderLayer["Overlay"] = 5] = "Overlay";
    // the very top layer
    RenderLayer[RenderLayer["Top"] = 6] = "Top";
    // the number of layers
    RenderLayer[RenderLayer["Count"] = 7] = "Count";
})(RenderLayer || (RenderLayer = {}));
// the canvas view keeps track of the parent svg element of each renderable 'thing' on the canvas
class SceneManager {
    constructor(svg) {
        this.layers = new Array();
        this.svg = svg;
        for (let k = 0; k < RenderLayer.Count; k++) {
            let layer = this.createElement("g", SVGGElement);
            layer.setAttribute("id", RenderLayer[k].toSnakeCase());
            this.layers.push(layer);
            this.svg.appendChild(layer);
        }
    }
    // creates the requested element type and optionally adds it to the requested layer
    createElement(tag, type, layer) {
        let element = document.createElementNS(SVG_NAMESPACE, tag);
        throwIfNotType(element, SVGElement);
        throwIfNotType(element, type);
        if (layer) {
            this.addElement(element, layer);
        }
        return element;
    }
    // add the element to the root of our SVG document
    addElement(element, layer) {
        throwIfEqual(layer, RenderLayer.Count);
        this.layers[layer].appendChild(element);
    }
    // remove the element from the root of our SVG document
    removeElement(element) {
        throwIfNull(element.parentNode);
        element.parentNode.removeChild(element);
    }
}
