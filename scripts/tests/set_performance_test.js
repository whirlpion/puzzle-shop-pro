"use strict";
async function timedTest(func) {
    const startTime = Date.now();
    await test.run(func);
    const endTime = Date.now();
    return endTime - startTime;
}
async function setStressTest(fromNumber, T, setSize, totalOperations) {
    throwIfFalse(setSize <= totalOperations);
    const iterations = totalOperations / setSize;
    const addTime = await timedTest(() => {
        for (let i = 0; i < iterations; i++) {
            const set = new T();
            for (let k = 0; k < setSize; k++) {
                set.add(fromNumber(k));
            }
        }
    });
    let deleteTime = await timedTest(() => {
        for (let i = 0; i < iterations; i++) {
            const set = new T();
            for (let k = 0; k < setSize; k++) {
                set.add(fromNumber(k));
            }
            for (let k = 0; k < setSize; k++) {
                set.delete(fromNumber(k));
            }
        }
    });
    deleteTime = Math.max(0.0, deleteTime - addTime);
    let hasTime = await timedTest(() => {
        for (let i = 0; i < iterations; i++) {
            const set = new T();
            for (let k = 0; k < setSize; k++) {
                set.add(fromNumber(k));
            }
            for (let k = 0; k < setSize; k++) {
                set.has(fromNumber(k));
            }
        }
    });
    hasTime = Math.max(0.0, hasTime - addTime);
    let iterationTime = await timedTest(() => {
        for (let i = 0; i < iterations; i++) {
            const set = new T();
            for (let k = 0; k < setSize; k++) {
                set.add(fromNumber(k));
            }
            for (let _val of set) {
            }
        }
    });
    iterationTime = Math.max(0.0, iterationTime - addTime);
    return `${(addTime) / totalOperations}, ${deleteTime / totalOperations}, ${hasTime / totalOperations}, ${iterationTime / totalOperations}`;
}
async function set_performance() {
    await test.begin("Set Performance");
    const totalOperations = 131072;
    const setSizes = [1, 2, 4, 8, 16, 128, 256, 1024, 4096, 32768, 131072];
    const a = u32.fromNumber(1664525);
    const c = u32.fromNumber(1013904223);
    let toNumber = (n) => {
        let u = u32.fromNumber(n);
        return u32.add(u32.mul(u, a), c).value;
    };
    await test.println("size,add, delete, has, iterate");
    await test.println("--- Number ---");
    await test.println("Set");
    for (let setSize of setSizes) {
        const report = await setStressTest(toNumber, Set, setSize, totalOperations);
        test.println(`${setSize},${report}`);
    }
    await test.println("BSTSet");
    for (let setSize of setSizes) {
        const report = await setStressTest(toNumber, BSTSet, setSize, totalOperations);
        test.println(`${setSize},${report}`);
    }
    await test.println("HashSet");
    for (let setSize of setSizes) {
        const report = await setStressTest(toNumber, HashSet, setSize, totalOperations);
        test.println(`${setSize},${report}`);
    }
    let toString = (n) => {
        let u = u32.fromNumber(toNumber(n));
        return u.toString();
    };
    await test.println("--- String ---");
    await test.println("Set");
    for (let setSize of setSizes) {
        const report = await setStressTest(toString, Set, setSize, totalOperations);
        test.println(`${setSize},${report}`);
    }
    await test.println("BSTSet");
    for (let setSize of setSizes) {
        const report = await setStressTest(toString, BSTSet, setSize, totalOperations);
        test.println(`${setSize},${report}`);
    }
    await test.println("HashSet");
    for (let setSize of setSizes) {
        const report = await setStressTest(toString, HashSet, setSize, totalOperations);
        test.println(`${setSize},${report}`);
    }
}
