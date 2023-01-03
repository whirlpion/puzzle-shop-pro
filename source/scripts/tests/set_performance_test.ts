async function timedTest(func: {(): void}): Promise<number> {
    const startTime: number = Date.now();
    await test.run(func);
    const endTime: number = Date.now();
    return endTime - startTime;
}

async function setStressTest<S extends IHash & IEquals & IOrdered,T extends Set<S> | BSTSet<S> | HashSet<S>>(fromNumber: {(i: number): S},T: {new(...args: any[]): T}, setSize: number, totalOperations: number): Promise<string> {
    throwIfFalse(setSize <= totalOperations);

    const iterations: number = totalOperations / setSize;

    const addTime = await timedTest(() => {
        for (let i = 0; i < iterations; i++) {
            const set: T = new T();

            for (let k = 0; k < setSize; k++) {
                set.add(fromNumber(k));
            }
        }
    });

    let deleteTime = await timedTest(() => {
        for (let i = 0; i < iterations; i++) {
            const set: T = new T();

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
            const set: T = new T();

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
            const set: T = new T();

            for (let k = 0; k < setSize; k++) {
                set.add(fromNumber(k));
            }

            for (let _val of set) {

            }
        }
    });
    iterationTime = Math.max(0.0, iterationTime - addTime);

    return `${(addTime) / totalOperations}, ${deleteTime / totalOperations}, ${hasTime / totalOperations}, ${iterationTime / totalOperations}`
}

async function set_performance() {
    await test.begin("Set Performance");

    const totalOperations: number = 131072;

    const setSizes: number[] = [1,2,4,8,16,128,256,1024,4096,32768,131072];

    const a = u32.fromNumber(1664525);
    const c = u32.fromNumber(1013904223);
    let toNumber = (n:number): number => {
        let u = u32.fromNumber(n);
        return u32.add(u32.mul(u, a), c).value;
    };

    await test.println("size,add, delete, has, iterate");

    await test.println("--- Number ---");
    await test.println("Set");
    for(let setSize of setSizes) {
        const report = await setStressTest<number,Set<number>>(toNumber, Set,setSize,totalOperations);
        test.println(`${setSize},${report}`);
    }

    await test.println("BSTSet");
    for(let setSize of setSizes) {
        const report = await setStressTest<number,BSTSet<number>>(toNumber, BSTSet,setSize,totalOperations);
        test.println(`${setSize},${report}`);
    }

    await test.println("HashSet");
    for(let setSize of setSizes) {
        const report = await setStressTest<number,HashSet<number>>(toNumber, HashSet,setSize,totalOperations);
        test.println(`${setSize},${report}`);
    }

    let toString = (n:number): string => {
        let u = u32.fromNumber(toNumber(n));
        return u.toString();
    };
    await test.println("--- String ---");
    await test.println("Set");
    for(let setSize of setSizes) {
        const report = await setStressTest<string,Set<string>>(toString, Set,setSize,totalOperations);
        test.println(`${setSize},${report}`);
    }

    await test.println("BSTSet");
    for(let setSize of setSizes) {
        const report = await setStressTest<string,BSTSet<string>>(toString, BSTSet,setSize,totalOperations);
        test.println(`${setSize},${report}`);
    }

    await test.println("HashSet");
    for(let setSize of setSizes) {
        const report = await setStressTest<string,HashSet<string>>(toString, HashSet,setSize,totalOperations);
        test.println(`${setSize},${report}`);
    }
}
