// object used for set/map tests
class Person {
    age: number;
    name: string;

    constructor(age: number, name: string) {
        this.age = age;
        this.name = name;
    }

    // first sort by age then by name
    compare(that: Person): Ordering {
        if (this.age < that.age) {
            return Ordering.LessThan;
        } else if(this.age == that.age) {
            if (this.name < that.name) {
                return Ordering.LessThan;
            } else if (this.name == that.name) {
                return Ordering.Equal;
            } else {
                return Ordering.GreaterThan;
            }
        } else {
            return Ordering.GreaterThan;
        }
    }

    equals(that: Person): boolean {
        return this.age === that.age && this.name === that.name;
    }

    hash<T extends IHashImplementation>(state: Hasher<T>): void {
        state.writeNumbers(this.age);
        state.writeStrings(this.name);
    }
}

class test {

    static _body: HTMLBodyElement | null = null;
    static get body(): HTMLBodyElement {
        if (!test._body) {
            test._body = document.querySelector("body");
        }
        return <HTMLBodyElement>test._body;
    }

    static _ul: HTMLUListElement | null = null;
    static get ul(): HTMLUListElement {
        if (!test._ul) {
            test._ul = document.querySelector("body > ul");
        }
        return <HTMLUListElement>test._ul;
    }

    static async run(func: {(): void}) {
        return new Promise<void>((resolve, _reject) => {
            globalThis.setTimeout(() => {
                func();
                resolve();
            }, 0);
        });
    }

    static async begin(name: string) {
        this.run(() => {
            let li = document.createElement("li");
            li.style.fontWeight = "bold";
            li.textContent = `--- Begin ${name} Test ---`;
            test.ul.appendChild(li);
        });
    }

    static async println(msg: string) {
        this.run(() => {
            let li = document.createElement("li");
            li.textContent = msg;
            test.ul.appendChild(li);
        });
    }

    static error(err: any): void {
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
        } else {
            root.textContent = err.toString();
        }
    }
}

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
    await set_performance();
}