"use strict";
class ZoomTool extends ITool {
    constructor(toolBox, puzzleGrid, actionStack, sceneManager) {
        super(toolBox, puzzleGrid, actionStack, sceneManager);
        this.ZOOM_FACTOR = Math.pow(2.0, 1 / 4);
    }
    get mode() {
        return ToolMode.NoOp;
    }
    handleMouseClick(event) {
        const zoom = this.sceneManager.zoom;
        if (event.shortcutKey) {
            this.sceneManager.zoomViewport(zoom / this.ZOOM_FACTOR);
        }
        else {
            this.sceneManager.zoomViewport(zoom * this.ZOOM_FACTOR);
        }
        return true;
    }
}
