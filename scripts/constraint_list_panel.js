"use strict";
class ConstraintRenameAction extends IAction {
    apply() {
        this.constraint.name = this.newName;
        const entry = this.constraintToEntry.get(this.constraint);
        throwIfNull(entry);
        entry.textContent = this.newName;
    }
    revert() {
        this.constraint.name = this.oldName;
        const entry = this.constraintToEntry.get(this.constraint);
        throwIfNull(entry);
        entry.textContent = this.oldName;
    }
    constructor(constraintToEntry, constraint, newName, oldName) {
        super(`rename constraint '${oldName}' to '${newName}'`);
        this.constraintToEntry = constraintToEntry;
        this.constraint = constraint;
        this.newName = newName;
        this.oldName = oldName;
    }
}
class ConstraintListPanel {
    constructor(parent, puzzleGrid, actionStack, toolBox) {
        this.constraintToEntry = new Map();
        this.listElement = document.createElement("list-element");
        parent.appendChild(this.listElement);
        this.puzzleGrid = puzzleGrid;
        this.actionStack = actionStack;
        this.toolBox = toolBox;
        puzzleGrid.addEventListener(PuzzleEventType.ConstraintsAdded, (event) => {
            let constraintEvent = (event);
            for (let constraint of constraintEvent.constraints) {
                this.addConstraint(constraint);
            }
        });
        puzzleGrid.addEventListener(PuzzleEventType.ConstraintsRemoved, (event) => {
            let constraintEvent = (event);
            for (let constraint of constraintEvent.constraints) {
                this.removeConstraint(constraint);
            }
        });
        puzzleGrid.addEventListener(PuzzleEventType.ConstraintsSelected, (event) => {
            let constraintEvent = (event);
            for (let constraint of constraintEvent.constraints) {
                let entry = this.constraintToEntry.get(constraint);
                if (entry) {
                    this.listElement.selectChild(entry);
                }
            }
        });
        puzzleGrid.addEventListener(PuzzleEventType.ConstraintsDeselected, (event) => {
            let constraintEvent = (event);
            for (let constraint of constraintEvent.constraints) {
                let entry = this.constraintToEntry.get(constraint);
                if (entry) {
                    this.listElement.deselectChild(entry);
                }
            }
        });
    }
    addConstraint(constraint) {
        let entry = document.createElement("content-edit-element");
        entry.textContent = constraint.name;
        entry.addEventListener("textcontentchanged", (event) => {
            let customEvent = (event);
            let oldName = constraint.name;
            constraint.name = customEvent.detail.content;
            this.actionStack.pushAction(new ConstraintRenameAction(this.constraintToEntry, constraint, constraint.name, oldName));
        });
        entry.addEventListener("elementselected", (_event) => {
            console.log(`selected ${entry.textContent}`);
            this.puzzleGrid.selectConstraint(constraint);
            this.puzzleGrid.updateSelectionBox();
            this.toolBox.switchToTool(ToolID.ObjectSelection);
        });
        entry.addEventListener("elementdeselected", (_event) => {
            console.log(`selected ${entry.textContent}`);
            this.puzzleGrid.unselectConstraint(constraint);
            this.puzzleGrid.updateSelectionBox();
            this.toolBox.switchToTool(ToolID.ObjectSelection);
        });
        this.listElement.appendChild(entry);
        this.constraintToEntry.set(constraint, entry);
    }
    removeConstraint(constraint) {
        let entry = this.constraintToEntry.get(constraint);
        throwIfNull(entry);
        this.listElement.removeChild(entry);
    }
}
