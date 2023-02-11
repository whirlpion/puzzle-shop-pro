class ConstraintListPanel {
    listElement: ListElement;

    constructor(parent: HTMLDivElement) {
        this.listElement = <ListElement>document.createElement("list-element");
        parent.appendChild(this.listElement);
    }

    addConstraint(constraint: IConstraint) {
        console.log(`constraint: ${constraint.name}`);
        let entry = <ContentEditElement>document.createElement("content-edit-element");
        entry.textContent = constraint.name;
        this.listElement.appendChild(entry);
    }
}