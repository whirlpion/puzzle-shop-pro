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
    puzzleGrid: PuzzleGrid;
    actionStack: UndoRedoStack;
    toolBox: ToolBox;

    constructor(parent: HTMLDivElement, puzzleGrid: PuzzleGrid, actionStack: UndoRedoStack, toolBox: ToolBox) {
        this.listElement = <ListElement>document.createElement("list-element");
        parent.appendChild(this.listElement);
        this.puzzleGrid = puzzleGrid;
        this.actionStack = actionStack;
        this.toolBox = toolBox;

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

        puzzleGrid.addEventListener(
            PuzzleEventType.ConstraintsSelected,
            (event: PuzzleEvent) => {
                let constraintEvent = <ConstraintEvent>(event);
                for (let constraint of constraintEvent.constraints) {
                    let entry = this.constraintToEntry.get(constraint);
                    if (entry) {
                        this.listElement.selectChild(entry);
                    }
                }
        });

        puzzleGrid.addEventListener(
            PuzzleEventType.ConstraintsDeselected,
            (event: PuzzleEvent) => {
                let constraintEvent = <ConstraintEvent>(event);
                for (let constraint of constraintEvent.constraints) {
                    let entry = this.constraintToEntry.get(constraint);
                    if (entry) {
                        this.listElement.deselectChild(entry);
                    }
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
        entry.addEventListener("elementselected", (_event: Event) => {
            console.log(`selected ${entry.textContent}`);
            this.puzzleGrid.selectConstraint(constraint);
            this.puzzleGrid.updateSelectionBox();
            this.toolBox.switchToTool(ToolID.ObjectSelection);
        });
        entry.addEventListener("elementdeselected", (_event: Event) => {
            console.log(`selected ${entry.textContent}`);
            this.puzzleGrid.unselectConstraint(constraint);
            this.puzzleGrid.updateSelectionBox();
            this.toolBox.switchToTool(ToolID.ObjectSelection);
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