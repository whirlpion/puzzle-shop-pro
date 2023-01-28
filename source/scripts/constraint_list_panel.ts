class ConstraintListPanel {
    listWidget: ListElement;

    constructor(parent: HTMLDivElement) {
        this.listWidget = <ListElement>document.createElement("div", {is : "list-element"});
        parent.appendChild(this.listWidget);
    }

    addConstraint(constraint: IConstraint) {
        let entry = <ContentEditElement>document.createElement("div", {is : "content-edit-element"});
        entry.textContent = constraint.name;
        this.listWidget.addEntry(entry);
    }
}