class ListElement extends HTMLDivElement {
    constructor() {
        super();
    }

    // todo: figure out to get TypeScript to play nicely with this
    addEntry(...entries: HTMLElement[]): void {
        for (let entry of entries) {
            entry.classList.add("list-entry");
            this.appendChild(entry);
        }
    }
}
globalThis.customElements.define("list-element", ListElement, { extends: "div" });

// todo: need to fix bubbling order >:[
class ContentEditElement extends HTMLDivElement {
    private cachedTextContent: string | null = null;

    constructor() {
        super();
        this.classList.add("content-edit-element");

        // make focusbale
        this.setAttribute("tabindex", "0");

        this.addEventListener("dblclick", (_event: Event) => {
            this.setAttribute("contenteditable", "true");
            this.cachedTextContent = this.textContent;

            const range = document.createRange();
            range.selectNodeContents(this);

            const selection = globalThis.getSelection();
            throwIfNull(selection);
            selection.removeAllRanges();
            selection.addRange(range);
        });

        this.addEventListener("focus", (_event: Event) => {
            console.log("focus");
        });

        this.addEventListener("keydown", (event: Event) => {
            const keyboardEvent = <KeyboardEvent>event;
            if (keyboardEvent.code === "Enter") {
                this.setAttribute("contenteditable", "false");

                const selection = globalThis.getSelection();
                throwIfNull(selection);
                selection.removeAllRanges();

                this.cachedTextContent = null;
                event.preventDefault();
                event.stopPropagation();
            } else if (keyboardEvent.code === "Escape") {
                this.setAttribute("contenteditable", "false");

                const selection = globalThis.getSelection();
                throwIfNull(selection);
                selection.removeAllRanges();

                this.textContent = this.cachedTextContent;
                this.cachedTextContent = null;
                event.preventDefault();
                event.stopPropagation();
            } else if (this.cachedTextContent !== null) {
                event.stopPropagation();
            }
        });

        this.addEventListener("blur", (_event: Event) => {
            this.setAttribute("contenteditable", "false");
            this.cachedTextContent = null;

            const selection = globalThis.getSelection();
            throwIfNull(selection);
            selection.removeAllRanges();

        });
    }
}
globalThis.customElements.define("content-edit-element", ContentEditElement, { extends: "div" });
