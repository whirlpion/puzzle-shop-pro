"use strict";
class ConstraintListPanel {
    constructor(parent) {
        this.listElement = document.createElement("list-element");
        parent.appendChild(this.listElement);
    }
    addConstraint(constraint) {
        console.log(`constraint: ${constraint.name}`);
        let entry = document.createElement("content-edit-element");
        entry.textContent = constraint.name;
        this.listElement.appendChild(entry);
    }
}
