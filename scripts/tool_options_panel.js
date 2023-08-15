"use strict";
class Setting {
    constructor() {
    }
}
class SettingOption extends Setting {
    constructor(options, value, changeCallback) {
        super();
        this.options = options;
        this.value = value;
        this.changeCallback = changeCallback;
    }
    getHTMLElement() {
        let selectElement = document.createElement("select");
        for (let [option, name] of this.options) {
            let optionElement = document.createElement("option");
            optionElement.setAttribute("value", option);
            if (option == this.value) {
                optionElement.setAttribute("selected", "true");
            }
            optionElement.textContent = name;
            selectElement.appendChild(optionElement);
        }
        selectElement.addEventListener("change", (event) => {
            if (event.target) {
                const target = event.target;
                this.changeCallback(target.value);
            }
        });
        return selectElement;
    }
}
// class SettingBooleanData extends Setting {
// }
// class SettingDataInteger extends Setting {
// }
class SettingElement extends HTMLElement {
    setSetting(name, setting) {
        const nameElement = document.createElement("div");
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
    constructor(parent) {
        this.rootElement = document.createElement("div");
        parent.appendChild(this.rootElement);
    }
    clearChildren() {
        this.rootElement.clearChildren();
    }
    initSettings(settings) {
        for (const [name, setting] of settings.entries()) {
            const settingElement = document.createElement("setting-element");
            settingElement.setSetting(name, setting);
            this.rootElement.appendChild(settingElement);
        }
    }
}
