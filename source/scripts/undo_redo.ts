abstract class IAction {
    abstract apply(): void;
    abstract revert(): void;

    description: string;

    constructor(description: string) {
        this.description = description;
    }
}

class UndoRedoStack {
    undoStack: Array<IAction>;
    redoStack: Array<IAction>;

    constructor() {
        this.undoStack = new Array();
        this.redoStack = new Array();
    }

    doAction(action: IAction) {
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
