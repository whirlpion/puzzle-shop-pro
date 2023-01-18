"use strict";
// object used for set/map tests
class Person {
    constructor(age, name) {
        this.age = age;
        this.name = name;
    }
    // first sort by age then by name
    compare(that) {
        if (this.age < that.age) {
            return Ordering.LessThan;
        }
        else if (this.age == that.age) {
            if (this.name < that.name) {
                return Ordering.LessThan;
            }
            else if (this.name == that.name) {
                return Ordering.Equal;
            }
            else {
                return Ordering.GreaterThan;
            }
        }
        else {
            return Ordering.GreaterThan;
        }
    }
    equals(that) {
        return this.age === that.age && this.name === that.name;
    }
    hash(state) {
        state.writeNumbers(this.age);
        state.writeStrings(this.name);
    }
}
class test {
    static get body() {
        if (!test._body) {
            test._body = document.querySelector("body");
        }
        return test._body;
    }
    static get ul() {
        if (!test._ul) {
            test._ul = document.querySelector("body > ul");
        }
        return test._ul;
    }
    static async run(func) {
        return new Promise((resolve, _reject) => {
            globalThis.setTimeout(() => {
                func();
                resolve();
            }, 0);
        });
    }
    static async begin(name) {
        this.run(() => {
            let li = document.createElement("li");
            li.style.fontWeight = "bold";
            li.textContent = `--- Begin ${name} Test ---`;
            test.ul.appendChild(li);
        });
    }
    static async println(msg) {
        this.run(() => {
            let li = document.createElement("li");
            li.textContent = msg;
            test.ul.appendChild(li);
        });
    }
    static error(err) {
        test.body.style.background = "red";
        let root = document.createElement("li");
        root.style.background = "pink";
        if (err instanceof Error) {
            root.textContent = err.message;
            test.ul.appendChild(root);
            if (err.stack) {
                let stackTrace = document.createElement("ul");
                root.appendChild(stackTrace);
                for (let line of err.stack.split("\n")) {
                    line = line.trim();
                    if (line.length > 0) {
                        let site = document.createElement("li");
                        site.textContent = line;
                        stackTrace.appendChild(site);
                    }
                }
            }
        }
        else {
            root.textContent = err.toString();
        }
    }
}
test._body = null;
test._ul = null;
async function run_tests() {
    test.body.appendChild(document.createElement("ul"));
    test.body.style.background = "lightgreen";
    await bst_set_test();
    await bst_map_test();
    await array_test();
    await u32_test();
    await xxhash32_test();
    await hasher_test();
    await hash_set_test();
    await hash_map_test();
    // await set_performance();
}
