async function hash_map_test() {
    await test.begin("HashMap<K,V>");
    try {
        let map: HashMap<Person,string> = new HashMap();
        const person1 = new Person(30, "Alice");
        const person2 = new Person(20, "Bob");
        const person3 = new Person(30, "Charlie");
        const person4 = new Person(30, "Charlie");
        const person5 = new Person(10, "Timmy");

        // the list of values when the persons are added
        const array: Array<[Person, string]> = new Array();
        array.push([person5, "A"]);  // Timmy
        array.push([person2, "B"]);  // Bob
        array.push([person1, "C"]);  // Alice
        array.push([person3, "D"]);  // Charlie

        await test.println("should add a new entry to the map");
        map.clear();
        map.set(person1, "C");
        throwIfFalse(map.has(person1));

        await test.println("should retrieve the value of an entry");
        map.clear();
        map.set(person1, "C");
        throwIfNotEqual(map.get(person1), "C");

        await test.println("should delete an entry from the map");
        map.clear();
        map.set(person1, "C");
        map.delete(person1);
        throwIfTrue(map.has(person1));
        throwIfFalse(map.size == 0);

        await test.println("should return the correct size of the map");
        map.clear();
        map.set(person1, "C");
        map.set(person2, "B");
        map.set(person3, "D");
        throwIfNotEqual(map.size, 3);

        await test.println("should clear all entries in the map");
        map.clear();
        map.set(person1, "C");
        map.set(person2, "B");
        map.clear();
        throwIfNotEqual(map.size, 0);

        await test.println("should iterate over the entries of the map");
        map.clear();
        map.set(person1, "C");
        map.set(person2, "B");
        map.set(person3, "D");
        map.set(person4, "D");
        map.set(person5, "A");

        const entries: Array<[Person, string]> = Array.collect(map.entries());
        throwIfNotEqual(entries.length, map.size);

        for (let [key, value] of entries) {
            throwIfFalse(map.has(key) && map.get(key) === value);
        }

        await test.println("should iterate over the keys of the map");
        const keys: Array<Person> = Array.collect(map.keys());
        throwIfNotEqual(keys.length, map.size);

        for (let key of keys) {
            throwIfFalse(map.has(key));
        }

        await test.println("should iterate over the values of the map");
        const values: Array<string> = Array.collect(map.values());
        throwIfNotEqual(values.length, map.size);

        for (let k = 0; k < values.length; k++) {
            throwIfNotEqual(entries[k][1], values[k]);
        }

    } catch (err) {
        test.error(err);
    }
}