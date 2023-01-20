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
    RenderLayer[RenderLayer["Foreground"] = 6] = "Foreground";
    // the number of layers
    RenderLayer[RenderLayer["Count"] = 7] = "Count";
})(RenderLayer || (RenderLayer = {}));
var Cursor;
(function (Cursor) {
    Cursor["Default"] = "default";
    Cursor["Grab"] = "grab";
    Cursor["Grabbing"] = "grabbing";
})(Cursor || (Cursor = {}));
// the canvas view keeps track of the parent svg element of each renderable 'thing' on the canvas
class SceneManager {
    get zoom() {
        return this._zoom;
    }
    constructor(parent) {
        this.layers = new Array();
        // center of viewport in world space
        this.lookX = 0.0;
        this.lookY = 0.0;
        // number of screen coordinates per world coordinate
        this._zoom = 1.0;
        // value of zoom at gesture start
        this.zoomStart = 1.0;
        // the initial distance between two fingers for pinch to zoom
        this.distanceStart = 0;
        // previous cursor when SceneManager take changes it
        this.previousCursor = Cursor.Default;
        // is the 'Space' key pressed
        this.canDrag = false;
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
        this._zoom = Math.clamp(0.25, zoom, 4.0);
        this.updateViewBox();
    }
    // Input Handling
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
                zoom *= Math.pow(1.10, -deltaY);
            }
            else {
                zoom *= Math.pow(1 / 1.10, deltaY);
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
    handleGestureStart(_event) {
        this.zoomStart = this.zoom;
        return true;
    }
    handleGestureChange(event) {
        this.zoomViewport(this.zoomStart * event.scale);
        return true;
    }
    handleTouchStart(event) {
        if (event.touches.length === 2) {
            // calculate the distance between the two touches
            const touch1 = event.touches[0];
            const touch2 = event.touches[1];
            this.distanceStart = Math.hypot(touch1.clientX - touch2.clientX, touch1.clientY - touch2.clientY);
            this.zoomStart = this.zoom;
            return true;
        }
        return false;
    }
    handleTouchMove(event) {
        if (event.touches.length === 2) {
            // calculate the current distance between the two touches
            const touch1 = event.touches[0];
            const touch2 = event.touches[1];
            const distance = Math.hypot(touch1.clientX - touch2.clientX, touch1.clientY - touch2.clientY);
            // calculate the scale change based on the difference between the start and current distances
            const scale = distance / this.distanceStart;
            this.zoomViewport(this.zoomStart * scale);
            return true;
        }
        return false;
    }
    // Space + Click + Drag
    handleKeyDown(event) {
        if (!event.repeat && event.code === "Space") {
            this.previousCursor = this.svg.style.cursor;
            this.setMouseCursor(Cursor.Grab);
            this.canDrag = true;
            return true;
        }
        return false;
    }
    handleKeyUp(event) {
        if (event.code === "Space" && this.canDrag) {
            this.setMouseCursor(this.previousCursor);
            this.canDrag = false;
            return true;
        }
        return false;
    }
    handleMouseDown(event) {
        if (event.primaryButton && this.canDrag) {
            this.setMouseCursor(Cursor.Grabbing);
            return true;
        }
        return false;
    }
    handleMouseClick(_event) {
        if (this.canDrag) {
            this.setMouseCursor(Cursor.Grab);
            return true;
        }
        return false;
    }
    handleMouseMove(event) {
        if (event.primaryButton && this.canDrag) {
            this.translateViewport(-event.movementX, -event.movementY);
            return true;
        }
        return false;
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
    // add the element to the specified layer of the SVG document
    addElement(element, layer) {
        throwIfEqual(layer, RenderLayer.Count);
        this.layers[layer].appendChild(element);
    }
    // remove the element from its parent
    removeElement(element) {
        throwIfNull(element.parentNode);
        element.parentNode.removeChild(element);
    }
    // set the mouse cursor over the puzzle canvas
    setMouseCursor(cursor) {
        this.svg.style.cursor = cursor;
    }
}
