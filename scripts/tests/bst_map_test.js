"use strict";
async function bst_map_test() {
    await test.begin("BSTMap<K,V>");
    try {
        let map = new BSTMap();
        const person1 = new Person(30, "Alice");
        const person2 = new Person(20, "Bob");
        const person3 = new Person(30, "Charlie");
        const person4 = new Person(30, "Charlie");
        const person5 = new Person(10, "Timmy");
        // the expected ordering when all the persons are added
        const array = new Array();
        array.push([person5, "A"]); // Timmy
        array.push([person2, "B"]); // Bob
        array.push([person1, "C"]); // Alice
        array.push([person3, "D"]); // Charlie
        await test.println("should add a new entry to the map");
        map = new BSTMap();
        map.set(person1, "C");
        throwIfFalse(map.has(person1));
        await test.println("should retrieve the value of an entry");
        map = new BSTMap();
        map.set(person1, "C");
        throwIfNotEqual(map.get(person1), "C");
        await test.println("should delete an entry from the map");
        map = new BSTMap();
        map.set(person1, "C");
        map.delete(person1);
        throwIfTrue(map.has(person1));
        throwIfFalse(map.size == 0);
        await test.println("should return the correct size of the map");
        map = new BSTMap();
        map.set(person1, "C");
        map.set(person2, "B");
        map.set(person3, "D");
        throwIfNotEqual(map.size, 3);
        await test.println("should clear all entries in the map");
        map = new BSTMap();
        map.set(person1, "C");
        map.set(person2, "B");
        map.clear();
        throwIfNotEqual(map.size, 0);
        await test.println("should iterate over the entries of the map");
        map = new BSTMap();
        map.set(person1, "C");
        map.set(person2, "B");
        map.set(person3, "D");
        map.set(person4, "D");
        map.set(person5, "A");
        const entries = [...map.entries()];
        throwIfNotEqual(entries.length, map.size);
        for (let k = 0; k < entries.length; k++) {
            throwIfNotEqual(entries[k][0].age, array[k][0].age);
            throwIfNotEqual(entries[k][0].name, array[k][0].name);
            throwIfNotEqual(entries[k][1], array[k][1]);
        }
        await test.println("should iterate over the keys of the map");
        map = new BSTMap();
        map.set(person1, "C");
        map.set(person2, "B");
        map.set(person3, "D");
        map.set(person4, "D");
        map.set(person5, "A");
        const keys = [...map.keys()];
        throwIfNotEqual(keys.length, map.size);
        for (let k = 0; k < keys.length; k++) {
            throwIfNotEqual(keys[k].age, array[k][0].age);
            throwIfNotEqual(keys[k].name, array[k][0].name);
        }
        await test.println("should iterate over the values of the map");
        map = new BSTMap();
        map.set(person1, "C");
        map.set(person2, "B");
        map.set(person3, "D");
        map.set(person4, "D");
        map.set(person5, "A");
        const values = [...map.values()];
        throwIfNotEqual(values.length, map.size);
        for (let k = 0; k < values.length; k++) {
            throwIfNotEqual(values[k], array[k][1]);
            throwIfNotEqual(values[k], array[k][1]);
        }
        await test.println("should iterate over set entires in sorted order");
        map = new BSTMap();
        map.set(person1, "C");
        map.set(person2, "B");
        map.set(person3, "D");
        map.set(person4, "D");
        map.set(person5, "A");
        let index = 0;
        for (let [key, value] of map) {
            throwIfNotEqual(array[index][0].name, key.name);
            throwIfNotEqual(array[index][0].age, key.age);
            throwIfNotEqual(array[index][1], value);
            index++;
        }
    }
    catch (err) {
        test.error(err);
    }
}
