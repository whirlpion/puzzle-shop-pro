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
        let body = document.querySelector("body");
        throwIfNull(body);
        body.addEventListener("keydown", (event) => {
            let kevt = event;
            switch (kevt.key) {
                case 'z':
                case 'Z':
                    {
                        if (kevt.shortcutKey) {
                            if (!kevt.shiftKey) {
                                this.undo();
                            }
                            else {
                                this.redo();
                            }
                            event.stopPropagation();
                        }
                    }
                    break;
                default:
                    break;
            }
        }, { capture: true });
    }
    doAction(action) {
        console.debug(`doing: ${action.description}`);
        console.debug(action);
        action.apply();
        this.undoStack.push(action);
        this.redoStack = new Array();
    }
    undo() {
        let action = this.undoStack.pop();
        if (action !== undefined) {
            console.debug(`undo: ${action.description}`);
            console.debug(action);
            action.revert();
            this.redoStack.push(action);
        }
    }
    redo() {
        let action = this.redoStack.pop();
        if (action !== undefined) {
            console.debug(`redo: ${action.description}`);
            console.debug(action);
            action.apply();
            this.undoStack.push(action);
        }
    }
}
