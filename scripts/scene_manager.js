"use strict";
var RenderLayer;
(function (RenderLayer) {
    // the very back layer
    RenderLayer[RenderLayer["Background"] = 0] = "Background";
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
    RenderLayer[RenderLayer["Foregrouond"] = 6] = "Foregrouond";
    // the number of layers
    RenderLayer[RenderLayer["Count"] = 7] = "Count";
})(RenderLayer || (RenderLayer = {}));
// the canvas view keeps track of the parent svg element of each renderable 'thing' on the canvas
class SceneManager {
    constructor(parent) {
        this.layers = new Array();
        // center of viewport in world space
        this.lookX = 0.0;
        this.lookY = 0.0;
        // number of screen coordinates per world coordinate
        this.zoom = 1.0;
        const svg = this.createElement("svg", SVGSVGElement);
        svg.setAttribute("id", "canvas_root");
        parent.appendChild(svg);
        this.svg = svg;
        // create our render layer groups
        for (let k = 0; k < RenderLayer.Count; k++) {
            let layer = this.createElement("g", SVGGElement);
            layer.setAttribute("id", RenderLayer[k].toSnakeCase());
            this.layers.push(layer);
            this.svg.appendChild(layer);
        }
        // create background grid pattern
        const defs = this.createElement("defs", SVGDefsElement);
        this.svg.appendChild(defs);
        const pattern = this.createElement("pattern", SVGPatternElement);
        pattern.setAttributes(["id", "grid_pattern"], ["patternUnits", "userSpaceOnUse"], ["width", `${CELL_SIZE}`], ["height", `${CELL_SIZE}`]);
        defs.appendChild(pattern);
        const patternRect = this.createElement("rect", SVGRectElement);
        patternRect.setAttributes(["width", `${CELL_SIZE}`], ["height", `${CELL_SIZE}`], ["fill", "transparent"], ["stroke", Colour.LightGrey.toString()], ["stroke-width", "1"]);
        pattern.appendChild(patternRect);
        const backgroundGrid = this.createElement("rect", SVGRectElement, RenderLayer.Background);
        backgroundGrid.setAttribute("fill", "url(#grid_pattern)");
        this.backgroundGrid = backgroundGrid;
        this.resizeObserver = new ResizeObserver(() => {
            this.updateViewBox();
        });
        this.resizeObserver.observe(parent);
        this.updateViewBox();
    }
    // size of the svg in screen space
    get viewPort() {
        const rect = this.svg.getBoundingClientRect();
        return {
            width: rect.width,
            height: rect.height,
        };
    }
    get viewBox() {
        const viewPort = this.viewPort;
        const width = viewPort.width / this.zoom;
        const height = viewPort.height / this.zoom;
        const x = this.lookX - width / 2;
        const y = this.lookY - height / 2;
        return { x, y, width, height };
    }
    updateViewBox() {
        const viewBox = this.viewBox;
        this.backgroundGrid.setAttributes(["x", `${viewBox.x}`], ["y", `${viewBox.y}`], ["width", `${viewBox.width}`], ["height", `${viewBox.height}`]);
        this.svg.setAttribute("viewBox", `${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`);
    }
    screenSpaceToWorldSpace(x, y) {
        const viewPort = this.viewPort;
        const viewBox = this.viewBox;
        const u = x / viewPort.width;
        const t = y / viewPort.height;
        return {
            x: u * viewBox.width + viewBox.x,
            y: t * viewBox.height + viewBox.y,
        };
    }
    // move the look at vector in terms of screen-space coordinates
    translateViewport(x, y) {
        this.lookX += x / this.zoom;
        this.lookY += y / this.zoom;
        this.updateViewBox();
    }
    // sets the zoom level
    zoomViewport(zoom) {
        throwIfFalse(zoom > 0);
        this.zoom = Math.clamp(0.25, zoom, 4.0);
        this.updateViewBox();
    }
    handleWheel(event) {
        let deltaX = event.deltaX;
        let deltaY = event.deltaY;
        if (event.shortcutKey) {
            switch (event.deltaMode) {
                case WheelEvent.DOM_DELTA_PIXEL:
                    deltaY /= CELL_SIZE;
                    break;
                case WheelEvent.DOM_DELTA_LINE:
                    break;
                case WheelEvent.DOM_DELTA_PAGE:
                    deltaY /= 5;
                    break;
            }
            let zoom = this.zoom;
            if (deltaY > 0) {
                zoom *= Math.pow(1.10, deltaY);
            }
            else {
                zoom *= Math.pow(1 / 1.10, -deltaY);
            }
            this.zoomViewport(zoom);
        }
        else {
            switch (event.deltaMode) {
                case WheelEvent.DOM_DELTA_PIXEL:
                    break;
                case WheelEvent.DOM_DELTA_LINE:
                    deltaX *= CELL_SIZE;
                    deltaY *= CELL_SIZE;
                    break;
                case WheelEvent.DOM_DELTA_PAGE:
                    deltaX *= CELL_SIZE * 5;
                    deltaY *= CELL_SIZE * 5;
                    break;
            }
            this.translateViewport(deltaX, deltaY);
        }
        return true;
    }
    // convert the screen space xy coordinates to a cell coordinate
    cellAtXY(x, y) {
        const coord = this.screenSpaceToWorldSpace(x, y);
        return Cell.fromXY(coord.x, coord.y);
    }
    cellAtMouseEvent(event) {
        return this.cellAtXY(event.offsetX, event.offsetY);
    }
    // creates the requested element type and optionally adds it to the requested layer
    createElement(tag, type, layer) {
        let element = document.createElementNS(SVG_NAMESPACE, tag);
        throwIfNotType(element, SVGElement);
        throwIfNotType(element, type);
        if (layer !== undefined) {
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
