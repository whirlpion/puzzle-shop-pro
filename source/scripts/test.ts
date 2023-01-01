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

    static println(msg: string): void {
        let li = document.createElement("li");
        li.textContent = msg;
        test.ul.appendChild(li);
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

function run_tests(): void {
    test.body.appendChild(document.createElement("ul"));

    bst_set_test();
    bst_map_test();
    array_test();
    u32_test();
    xxhash32_test();
    hasher_test();

    test.body.style.background = "lightgreen";
}