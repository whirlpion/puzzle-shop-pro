
async function bst_set_test() {
    await test.begin("BSTSet<T>");
    try {
        let set: BSTSet<Person> = new BSTSet();
        const person1 = new Person(30, "Alice");
        const person2 = new Person(20, "Bob");
        const person3 = new Person(30, "Charlie");
        const person4 = new Person(30, "Charlie");
        const person5 = new Person(10, "Timmy");

        // the expected ordering when all the persons are added
        let array: Array<Person> = new Array();
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

        await test.println("should return the set entries in sorted order");
        set.add(person3);
        set.add(person1);
        set.add(person2);
        set.add(person5);

        let values = [...set.entries()];
        throwIfNotEqual(values.length, set.size);

        for(let k = 0; k < values.length; k++) {
            throwIfNotEqual(array[k].age, values[k].age);
            throwIfNotEqual(array[k].name, values[k].name);
        }

        await test.println("should iterate over set entires in sorted order");
        let index = 0;
        for (let person of set) {
            throwIfNotEqual(array[index].name, person.name);
            throwIfNotEqual(array[index].age, person.age);
            index++;
        }

        await test.println("should return union of sets");
        let evens: BSTSet<number> = new BSTSet([0,2,4]);
        let odds: BSTSet<number> = new BSTSet([1,3,5]);

        // should contain all the numbers
        let union = [...BSTSet.union(evens,odds).entries()];
        throwIfFalse(union.equals([0,1,2,3,4,5]));

        // should contain just the even numbers
        union = [...BSTSet.union(evens,evens).entries()];
        throwIfFalse(union.equals([0,2,4]));

        // should contain just the odd numbes
        union = [...BSTSet.union(odds,odds).entries()];
        throwIfFalse(union.equals([1,3,5]));

    } catch (err) {
        test.error(err);
    }
}