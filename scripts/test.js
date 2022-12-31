"use strict";
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
    static println(msg) {
        let li = document.createElement("li");
        li.textContent = msg;
        test.ul.appendChild(li);
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
function run_tests() {
    test.body.appendChild(document.createElement("ul"));
    bst_set_test();
    bst_map_test();
    array_test();
    test.body.style.background = "lightgreen";
}
