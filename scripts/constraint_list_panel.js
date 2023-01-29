"use strict";
class ConstraintListPanel {
    constructor(parent) {
        this.listWidget = document.createElement("div", { is: "list-element" });
        parent.appendChild(this.listWidget);
    }
    addConstraint(constraint) {
        let entry = document.createElement("div", { is: "content-edit-element" });
        entry.textContent = constraint.name;
        this.listWidget.addEntry(entry);
    }
}
