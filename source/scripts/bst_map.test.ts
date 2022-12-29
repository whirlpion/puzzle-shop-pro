// type Person is defined in bst_set.tst.ts
{
  console.log("--- Begin BSTMap<K,V> test ---");

  let map: BSTMap<Person,string> = new BSTMap();
  const person1 = new Person(30, "Alice");
  const person2 = new Person(20, "Bob");
  const person3 = new Person(30, "Charlie");
  const person4 = new Person(30, "Charlie");
  const person5 = new Person(10, "Timmy");

  // the expected ordering when all the persons are added
  const array: Array<[Person, string]> = new Array();
  array.push([person5, "A"]);  // Timmy
  array.push([person2, "B"]);  // Bob
  array.push([person1, "C"]);  // Alice
  array.push([person3, "D"]);  // Charlie

  console.log("should add a new entry to the map");
  map = new BSTMap();
  map.set(person1, "C");
  throwIfFalse(map.has(person1));

  console.log("should retrieve the value of an entry");
  map = new BSTMap();
  map.set(person1, "C");
  throwIfNotEqual(map.get(person1), "C");

  console.log("should delete an entry from the map");
  map = new BSTMap();
  map.set(person1, "C");
  map.delete(person1);
  throwIfTrue(map.has(person1));
  throwIfFalse(map.size == 0);

  console.log("should return the correct size of the map");
  map = new BSTMap();
  map.set(person1, "C");
  map.set(person2, "B");
  map.set(person3, "D");
  throwIfNotEqual(map.size, 3);

  console.log("should clear all entries in the map");
  map = new BSTMap();
  map.set(person1, "C");
  map.set(person2, "B");
  map.clear();
  throwIfNotEqual(map.size, 0);

  console.log("should iterate over the entries of the map");
  map = new BSTMap();
  map.set(person1, "C");
  map.set(person2, "B");
  map.set(person3, "D");
  map.set(person4, "D");
  map.set(person5, "A");

  const entries = map.entries();
  for (let [person, grade] of array) {
    let entry = entries.next();
    throwIfNotEqual(entry.value[0].age, person.age);
    throwIfNotEqual(entry.value[0].name, person.name);
    throwIfNotEqual(entry.value[1], grade);
  }

  console.log("should iterate over the keys of the map");
  map = new BSTMap();
  map.set(person1, "C");
  map.set(person2, "B");
  map.set(person3, "D");
  map.set(person4, "D");
  map.set(person5, "A");

  const keys = map.keys();
  for (let [person, _grade] of array) {
    let key = keys.next();
    throwIfNotEqual(key.value.age, person.age);
    throwIfNotEqual(key.value.name, person.name);
  }

  console.log("should iterate over the values of the map");
  map = new BSTMap();
  map.set(person1, "C");
  map.set(person2, "B");
  map.set(person3, "D");
  map.set(person4, "D");
  map.set(person5, "A");

  const values = map.values();
  for (let [_person, grade] of array) {
    let value = values.next();
    throwIfNotEqual(value.value, grade);
  }

  console.log("should iterate over set entires in sorted order");
  map = new BSTMap();
  map.set(person1, "C");
  map.set(person2, "B");
  map.set(person3, "D");
  map.set(person4, "D");
  map.set(person5, "A");

  for (let [key, value] of map) {
    console.log(` name: ${key.name}, age: ${key.age}, grade: ${value}`);
  }
}