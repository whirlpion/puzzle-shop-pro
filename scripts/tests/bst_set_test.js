"use strict";
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
}
function bst_set_test() {
    try {
        test.println("--- Begin BSTSet<T> test ---");
        let set = new BSTSet();
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
        test.println("should add a new element to the set");
        set.add(person1);
        throwIfFalse(set.has(person1));
        test.println("should return the correct size of the set");
        set.add(person1);
        set.add(person2);
        throwIfNotEqual(set.size, 2);
        test.println("should return the correct size after deleting an element from the set");
        set.add(person1);
        set.add(person2);
        set.delete(person1);
        throwIfNotEqual(set.size, 1);
        test.println("should return the correct size after clearing the set");
        set.add(person1);
        set.add(person2);
        set.clear();
        throwIfNotEqual(set.size, 0);
        test.println("should return the correct size after adding a duplicate element");
        set.add(person1);
        set.add(person2);
        set.add(person3);
        set.add(person4);
        throwIfNotEqual(set.size, 3);
        test.println("should return the correct size after clearing all elements");
        set.clear();
        throwIfNotEqual(set.size, 0);
        test.println("should return the set entries in sorted order");
        set.add(person3);
        set.add(person1);
        set.add(person2);
        set.add(person5);
        let values = Array.collect(set.entries());
        throwIfNotEqual(values.length, set.size);
        for (let k = 0; k < values.length; k++) {
            throwIfNotEqual(array[k].age, values[k].age);
            throwIfNotEqual(array[k].name, values[k].name);
        }
        test.println("should iterate over set entires in sorted order");
        let index = 0;
        for (let person of set) {
            throwIfNotEqual(array[index].name, person.name);
            throwIfNotEqual(array[index].age, person.age);
            index++;
        }
    }
    catch (err) {
        test.error(err);
    }
}
