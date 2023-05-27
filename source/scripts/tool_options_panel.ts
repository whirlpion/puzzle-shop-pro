abstract class Setting {
    public readonly name: string;

    constructor(name: string) {
        this.name = name;
    }

    abstract getHTML(): HTMLElement;
}

class SettingOption extends Setting {
    // array of option values, human readable names tuples
    values: Array<[value: string, name: string]>
    constructor(name: string, values: Array<[value: string, name: string]>) {
        super(name);
        this.values = values;
    }

    getHTML(): HTMLElement {
        let selectElement = <HTMLSelectElement>document.createElement("select");
        for (let [value, name] of this.values) {
            let optionElement = <HTMLOptionElement>document.createElement("option");
            optionElement.setAttribute("value", value);
            optionElement.textContent = name;
            selectElement.appendChild(optionElement);
        }
        return <HTMLElement>selectElement;
    }
}

// class SettingBooleanData extends Setting {

// }

// class SettingDataInteger extends Setting {

// }

class SettingElement extends HTMLElement {
    set setting(setting: Setting) {
        let nameElement = <HTMLDivElement>document.createElement("div");
        nameElement.textContent = setting.name;
        this.appendChild(nameElement);
        this.appendChild(setting.getHTML());
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

    initSettings(settings: Array<Setting>): void {
        for (let setting of settings) {
            let settingElement = <SettingElement>document.createElement("setting-element");
            settingElement.setting = setting;
            this.rootElement.appendChild(settingElement);
        }
    }
}