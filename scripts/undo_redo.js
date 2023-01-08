"use strict";
class IAction {
    constructor(description) {
        this.description = description;
    }
}
class UndoRedoStack {
    constructor() {
        this.undoStack = new Array();
        this.redoStack = new Array();
    }
    doAction(action) {
        console.debug(`do: ${action.description}`);
        action.apply();
        this.undoStack.push(action);
        this.redoStack = new Array();
    }
    undo() {
        let action = this.undoStack.pop();
        if (action !== undefined) {
            console.debug(`undo: ${action.description}`);
            action.revert();
            this.redoStack.push(action);
        }
    }
    redo() {
        let action = this.redoStack.pop();
        if (action !== undefined) {
            console.debug(`redo: ${action.description}`);
            action.apply();
            this.undoStack.push(action);
        }
    }
}