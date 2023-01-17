"use strict";
class PanTool extends ITool {
    constructor(toolBox, puzzleGrid, actionStack, sceneManager) {
        super(toolBox, puzzleGrid, actionStack, sceneManager);
    }
    handlePickUp(_prevTool) {
        this.sceneManager.setMouseCursor(Cursor.Grab);
    }
    handlePutDown(_nextTool) {
        this.sceneManager.setMouseCursor(Cursor.Default);
    }
    handleMouseDown(event) {
        if (event.primaryButton) {
            this.sceneManager.setMouseCursor(Cursor.Grabbing);
            return true;
        }
        return false;
    }
    handleMouseMove(event) {
        if (event.primaryButton) {
            this.sceneManager.translateViewport(-event.movementX, -event.movementY);
            return true;
        }
        return false;
    }
    handleMouseUp(event) {
        if (!event.primaryButton) {
            this.sceneManager.setMouseCursor(Cursor.Grab);
            return true;
        }
        return false;
    }
}
