
class Person {
    age: number;
    name: string;

    constructor(age: number, name: string) {
        this.age = age;
        this.name = name;
    }

    // first sort by age then by name
    cmp(that: Person): Ordering {
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
}

{
    console.log("--- Begin BSTSet<T> test ---");

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

    console.log("should add a new element to the set");
    set.add(person1);
    throwIfFalse(set.has(person1));

    console.log("should return the correct size of the set");
    set.add(person1);
    set.add(person2);
    throwIfNotEqual(set.size, 2);

    console.log("should return the correct size after deleting an element from the set");
    set.add(person1);
    set.add(person2);
    set.delete(person1);
    throwIfNotEqual(set.size, 1);

    console.log("should return the correct size after clearing the set");
    set.add(person1);
    set.add(person2);
    set.clear();
    throwIfNotEqual(set.size, 0);

    console.log("should return the correct size after adding a duplicate element");
    set.add(person1);
    set.add(person2);
    set.add(person3);
    set.add(person4);
    throwIfNotEqual(set.size, 3);

    console.log("should return the correct size after clearing all elements");
    set.clear();
    throwIfNotEqual(set.size, 0);

    console.log("should return the set entries in sorted order");
    set.add(person3);
    set.add(person1);
    set.add(person2);
    set.add(person5);

    const entries = set.entries();
    for (let person of array) {
        let entry = entries.next();
        throwIfNotEqual(entry.value.age, person.age);
        throwIfNotEqual(entry.value.name, person.name);
    }

    console.log("should iterate over set entires in sorted order");
    for (let person of set) {
        console.log(` name: ${person.name}, age: ${person.age}`);
    }
}