enum RenderLayer {
    // the very back layer
    Background,
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
    Foregrouond,
    // the number of layers
    Count,
}

// the canvas view keeps track of the parent svg element of each renderable 'thing' on the canvas
class SceneManager {
    svg: SVGSVGElement;
    backgroundGrid: SVGRectElement;
    layers: Array<SVGGElement> = new Array();

    // center of viewport in world space
    private lookX: number = 0.0;
    private lookY: number = 0.0;
    // number of view pixels per world pixel
    private zoom: number = 1.0;

    // resize observer to update our viewport dimensions
    private resizeObserver: ResizeObserver;

    constructor(parent: HTMLElement) {
        const svg = <SVGSVGElement>this.createElement("svg", SVGSVGElement);
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
        const defs = <SVGDefsElement>this.createElement("defs", SVGDefsElement);
        this.svg.appendChild(defs);
        const pattern = <SVGPatternElement>this.createElement("pattern", SVGPatternElement);
        pattern.setAttributes(
            ["id", "grid_pattern"],
            ["patternUnits","userSpaceOnUse"],
            ["width", `${CELL_SIZE}`],
            ["height", `${CELL_SIZE}`]);
        defs.appendChild(pattern);
        const patternRect  = <SVGRectElement>this.createElement("rect", SVGRectElement);
        patternRect.setAttributes(
            ["width",`${CELL_SIZE}`],
            ["height",`${CELL_SIZE}`],
            ["fill", "transparent"],
            ["stroke", Colour.LightGrey.toString()],
            ["stroke-width", "1"]);
        pattern.appendChild(patternRect);

        const backgroundGrid = <SVGRectElement>this.createElement("rect", SVGRectElement, RenderLayer.Background);
        backgroundGrid.setAttribute("fill", "url(#grid_pattern)");
        this.backgroundGrid = backgroundGrid;

        this.resizeObserver = new ResizeObserver(() => {
            this.updateViewBox();
        });
        this.resizeObserver.observe(parent);
        this.updateViewBox();
    }

    // size of the svg in screen space
    private get viewPort(): {width: number, height: number} {
        const rect  = this.svg.getBoundingClientRect();
        return {
            width: rect.width,
            height: rect.height,
        };
    }

    private get viewBox(): {x: number, y: number, width: number, height: number} {
        const viewPort = this.viewPort;
        const width = viewPort.width / this.zoom;
        const height = viewPort.height / this.zoom;
        const x = this.lookX - width / 2;
        const y = this.lookY - height / 2;

        return { x, y, width, height };
    }

    private updateViewBox(): void {
        const viewBox = this.viewBox;
        this.backgroundGrid.setAttributes(
            ["x", `${viewBox.x}`],
            ["y", `${viewBox.y}`],
            ["width", `${viewBox.width}`],
            ["height", `${viewBox.height}`]);

        this.svg.setAttribute("viewBox", `${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`);
    }

    private screenSpaceToWorldSpace(x: number, y: number): {x: number, y: number} {
        const viewPort = this.viewPort;
        const viewBox = this.viewBox;

        const u = x / viewPort.width;
        const t = y / viewPort.height;

        return {
            x: u * viewBox.width + viewBox.x,
            y: t * viewBox.height + viewBox.y,
        }
    }

    // move the look at vector in terms of screen-space coordinates
    translateViewport(_x: number, _y: number): void {

    }

    // sets the zoom level
    zoomViewport(_zoom: number): void {

    }

    // convert the screen space xy coordinates to a cell coordinate
    cellAtXY(x: number, y: number): Cell {
        const coord = this.screenSpaceToWorldSpace(x, y);
        return Cell.fromXY(coord.x, coord.y);
    }

    cellAtMouseEvent(event: MouseEvent): Cell {
        return this.cellAtXY(event.offsetX, event.offsetY);
    }

    // creates the requested element type and optionally adds it to the requested layer
    createElement<T>(tag: string, type: { new(...args: any[]): T }, layer?: RenderLayer): T {
        let element = document.createElementNS(SVG_NAMESPACE, tag);
        throwIfNotType<SVGElement>(element, SVGElement);
        throwIfNotType<T>(element, type);
        if (layer !== undefined) {
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