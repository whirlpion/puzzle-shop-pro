enum RenderLayer {
    // the very back layer
    Bottom,
    // background colour
    Fill,
    // puzzle grids
    Grid,
    // constraints to go on top of the grid
    Constraints,
    // user entered digits, pencil marks, etc
    PencilMark,
    // render on top
    Overlay,
    // the very top layer
    Top,
    // the number of layers
    Count,
}

// the canvas view keeps track of the parent svg element of each renderable 'thing' on the canvas
class SceneManager {
    svg: SVGSVGElement;
    layers: Array<SVGGElement> = new Array();

    constructor(svg: SVGSVGElement) {
        this.svg = svg;
        for (let k = 0; k < RenderLayer.Count; k++) {
            let layer = this.createElement("g", SVGGElement);
            layer.setAttribute("id", RenderLayer[k].toSnakeCase());
            this.layers.push(layer);
            this.svg.appendChild(layer);
        }
    }

    // creates the requested element type and optionally adds it to the requested layer
    createElement<T>(tag: string, type: { new(...args: any[]): T }, layer?: RenderLayer): T {
        let element = document.createElementNS(SVG_NAMESPACE, tag);
        throwIfNotType<SVGElement>(element, SVGElement);
        throwIfNotType<T>(element, type);
        if (layer) {
            this.addElement(element, layer);
        }
        return element;
    }

    // add the element to the root of our SVG document
    addElement(element: SVGElement, layer: RenderLayer): void {
        throwIfEqual(layer, RenderLayer.Count);
        this.layers[layer].appendChild(element);
    }

    // remove the element from the root of our SVG document
    removeElement(element: SVGElement): void {
        throwIfNull(element.parentNode);
        element.parentNode.removeChild(element);
    }
}