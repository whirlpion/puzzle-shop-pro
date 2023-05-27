abstract class Setting {

    constructor() {
    }

    abstract getHTMLElement(): HTMLElement;
}

class SettingOption extends Setting {
    // array of option values, human readable names tuples
    values: Array<[value: string, name: string]>
    changeCallback: {(value: string): void};

    constructor(values: Array<[value: string, name: string]>, changeCallback: {(value: string): void}) {
        super();
        this.values = values;
        this.changeCallback = changeCallback;
    }

    getHTMLElement(): HTMLElement {
        let selectElement = <HTMLSelectElement>document.createElement("select");
        for (let [value, name] of this.values) {
            let optionElement = <HTMLOptionElement>document.createElement("option");
            optionElement.setAttribute("value", value);
            optionElement.textContent = name;
            selectElement.appendChild(optionElement);
        }
        selectElement.addEventListener("change", (event: Event) => {
                if (event.target) {
                const target = <HTMLSelectElement>event.target;
                this.changeCallback(target.value);
            }
        });
        return <HTMLElement>selectElement;
    }


}

// class SettingBooleanData extends Setting {

// }

// class SettingDataInteger extends Setting {

// }

class SettingElement extends HTMLElement {
    setSetting(name: string, setting: Setting) {
        const nameElement = <HTMLDivElement>document.createElement("div");
        nameElement.textContent = name;
        this.appendChild(nameElement);
        this.appendChild(setting.getHTMLElement());
    }

    constructor() {
        super();
    }
}
globalThis.customElements.define("setting-element", SettingElement);

class ToolOptionsPanel {
    rootElement: HTMLDivElement;

    constructor(parent: HTMLDivElement) {
        this.rootElement = <HTMLDivElement>document.createElement("div");
        parent.appendChild(this.rootElement);
    }

    clearChildren(): void {
        this.rootElement.clearChildren();
    }

    initSettings(settings: Map<string, Setting>): void {
        for (const [name, setting] of settings.entries()) {
            const settingElement = <SettingElement>document.createElement("setting-element");
            settingElement.setSetting(name,setting);
            this.rootElement.appendChild(settingElement);
        }
    }
}