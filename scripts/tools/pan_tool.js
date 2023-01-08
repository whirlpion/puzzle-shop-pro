"use strict";
class PanTool extends ITool {
    constructor(toolBox, puzzleGrid, actionStack, sceneManager) {
        super(toolBox, puzzleGrid, actionStack, sceneManager);
        this.prevTool = null;
    }
    handlePickUp(prevTool, switchMethod) {
        if (switchMethod === SwitchMethod.Keyboard) {
            this.prevTool = prevTool;
        }
        else {
            this.prevTool = null;
        }
        this.sceneManager.setMouseCursor(Cursor.Grab);
    }
    handlePutDown(_nextTool) {
        this.sceneManager.setMouseCursor(Cursor.Default);
    }
    handleKeyUp(event) {
        if (this.prevTool && event.code === "Space") {
            const prevTool = this.prevTool;
            this.prevTool = null;
            this.toolBox.switchToTool(prevTool, SwitchMethod.Keyboard);
            return true;
        }
        return false;
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
