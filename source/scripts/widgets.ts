class ListElement extends HTMLElement {
    constructor() {
        super();
    }

    override appendChild<T extends Node>(element: T): T {
        throwIfNotType<Element>(element, Element);
        element.addEventListener("click", (event: Event) => {
            let mouseEvent = <MouseEvent>event;
            if (mouseEvent.shortcutKey) {
                if (element.classList.contains("selected")) {
                    this.deselectChildImpl(element, true);
                } else {
                    this.selectChildImpl(element, true);
                }
            } else if (mouseEvent.shiftKey) {
                if (!element.classList.contains("selected")) {
                    this.selectChildImpl(element, true);
                }
            } else {
                this.deselectAllChildren();
                this.selectChildImpl(element, true);
            }
        });
        return super.appendChild(element);
    }

    private deselectAllChildren(): void {
        for (let child of this.children) {
            if (child.classList.contains("selected")) {
                this.deselectChildImpl(child, true);
            }
        }
    }

    selectChild(element: Element): void {
        throwIfFalse(element.parentElement === this);
        this.selectChildImpl(element, false);
    }

    private selectChildImpl(element: Element, dispatchEvent: boolean): void {
        element.classList.add("selected");
        if (dispatchEvent) {
            const elementSelected = new CustomEvent("elementselected", {
                    detail: { target: element }
                });
            element.dispatchEvent(elementSelected);
        }
    }

    deselectChild(element: Element): void {
        throwIfFalse(element.parentElement === this);
        this.deselectChildImpl(element, false);
    }

    private deselectChildImpl(element: Element, dispatchEvent: boolean): void {
        element.classList.remove("selected");
        if (dispatchEvent) {
            const elementdeselected = new CustomEvent("elementdeselected", {
                    detail: { target: element }
                });
            element.dispatchEvent(elementdeselected);
        }
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

