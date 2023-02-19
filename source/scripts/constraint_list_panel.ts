class ConstraintRenameAction extends IAction {
    override apply(): void {
        this.constraint.name = this.newName;
        const entry = this.constraintToEntry.get(this.constraint);
        throwIfNull(entry);
        entry.textContent = this.newName;
    }

    override revert(): void {
        this.constraint.name = this.oldName;
        const entry = this.constraintToEntry.get(this.constraint);
        throwIfNull(entry);
        entry.textContent = this.oldName;
    }

    constraintToEntry: Map<IConstraint, ContentEditElement>;
    constraint: IConstraint;
    newName: string;
    oldName: string;

    constructor(constraintToEntry: Map<IConstraint, ContentEditElement>, constraint: IConstraint, newName: string, oldName: string) {
        super(`rename constraint '${oldName}' to '${newName}'`);
        this.constraintToEntry = constraintToEntry;
        this.constraint = constraint;
        this.newName = newName;
        this.oldName = oldName;
    }
}

class ConstraintListPanel {
    listElement: ListElement;
    constraintToEntry: Map<IConstraint, ContentEditElement> = new Map();
    actionStack: UndoRedoStack;

    constructor(parent: HTMLDivElement, puzzleGrid: PuzzleGrid, actionStack: UndoRedoStack) {
        this.listElement = <ListElement>document.createElement("list-element");
        parent.appendChild(this.listElement);
        this.actionStack = actionStack;

        puzzleGrid.addEventListener(
            PuzzleEventType.ConstraintsAdded,
            (event: PuzzleEvent) => {
                let constraintEvent = <ConstraintEvent>(event);
                for (let constraint of constraintEvent.constraints) {
                    this.addConstraint(constraint);
                }
        });

        puzzleGrid.addEventListener(
            PuzzleEventType.ConstraintsRemoved,
            (event: PuzzleEvent) => {
                let constraintEvent = <ConstraintEvent>(event);
                for (let constraint of constraintEvent.constraints) {
                    this.removeConstraint(constraint);
                }
        });
    }

    private addConstraint(constraint: IConstraint) {
        let entry = <ContentEditElement>document.createElement("content-edit-element");

        entry.textContent = constraint.name;
        entry.addEventListener("textcontentchanged", (event: Event) => {
            let customEvent = <CustomEvent>(event);
            let oldName = constraint.name;
            constraint.name = customEvent.detail.content;

            this.actionStack.pushAction(
                new ConstraintRenameAction(
                    this.constraintToEntry,
                    constraint,
                    constraint.name,
                    oldName));
        });
        this.listElement.appendChild(entry);
        this.constraintToEntry.set(constraint, entry);
    }

    private removeConstraint(constraint: IConstraint) {
        let entry = this.constraintToEntry.get(constraint);
        throwIfNull(entry);
        this.listElement.removeChild(entry);
    }
}