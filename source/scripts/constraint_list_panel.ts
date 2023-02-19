class ConstraintListPanel {
    listElement: ListElement;
    constraintToEntry: Map<IConstraint, ContentEditElement> = new Map();

    constructor(parent: HTMLDivElement, puzzleGrid: PuzzleGrid) {
        this.listElement = <ListElement>document.createElement("list-element");
        parent.appendChild(this.listElement);

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
            constraint.name = customEvent.detail.content;
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