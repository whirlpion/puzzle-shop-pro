"use strict";
async function hash_set_test() {
    await test.begin("HashSet<T>");
    try {
        let set = new HashSet();
        const person1 = new Person(30, "Alice");
        const person2 = new Person(20, "Bob");
        const person3 = new Person(30, "Charlie");
        const person4 = new Person(30, "Charlie");
        const person5 = new Person(10, "Timmy");
        // the expected ordering when all the persons are added
        let array = new Array();
        array.push(person5); // Timmy
        array.push(person2); // Bob
        array.push(person1); // Alice
        array.push(person3); // Charlie
        await test.println("should add a new element to the set");
        set.add(person1);
        throwIfFalse(set.has(person1));
        await test.println("should return the correct size of the set");
        set.add(person1);
        set.add(person2);
        throwIfNotEqual(set.size, 2);
        await test.println("should return the correct size after deleting an element from the set");
        set.add(person1);
        set.add(person2);
        set.delete(person1);
        throwIfNotEqual(set.size, 1);
        await test.println("should return the correct size after clearing the set");
        set.add(person1);
        set.add(person2);
        set.clear();
        throwIfNotEqual(set.size, 0);
        await test.println("should return the correct size after adding a duplicate element");
        set.add(person1);
        set.add(person2);
        set.add(person3);
        set.add(person4);
        throwIfNotEqual(set.size, 3);
        await test.println("should return the correct size after clearing all elements");
        set.clear();
        throwIfNotEqual(set.size, 0);
        await test.println("should contain all of the elements added");
        set = new HashSet(array);
        for (let person of array) {
            throwIfFalse(set.has(person));
        }
    }
    catch (err) {
        test.error(err);
    }
}
