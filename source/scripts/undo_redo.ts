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

        let body = document.querySelector("body");
        throwIfNull(body);

        body.addEventListener("keydown", (event: Event) => {
            let kevt = <KeyboardEvent>event;

            switch(kevt.key) {
            case 'z':
            case 'Z':
                {
                    if (kevt.ctrlKey) {
                        if (!kevt.shiftKey) {
                            this.undo();
                        } else {
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

    doAction(action: IAction) {
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
