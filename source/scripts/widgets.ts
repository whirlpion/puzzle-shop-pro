class ListElement extends HTMLElement {
    constructor() {
        super();
    }
}
globalThis.customElements.define("list-element", ListElement);


// todo: need to fix bubbling order >:[
class ContentEditElement extends HTMLElement {
    private cachedTextContent: string | null = null;

    constructor() {
        super();
    }

    connectedCallback(): void {
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

                const contentChanged = new CustomEvent("textcontentchanged", {
                        detail: { content: this.textContent }
                    });
                this.dispatchEvent(contentChanged);
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
            if (this.cachedTextContent !== null) {
                const contentChanged = new CustomEvent("textcontentchanged", {
                        detail: { content: this.textContent }
                    });
                this.dispatchEvent(contentChanged);
            }

            this.cachedTextContent = null;

            const selection = globalThis.getSelection();
            throwIfNull(selection);
            selection.removeAllRanges();

        });
    }
}
globalThis.customElements.define("content-edit-element", ContentEditElement);

