
async function array_test() {
    await test.begin("Array<T>");
    try {
        let array1: Array<number> = new Array();
        let array2: Array<number> = new Array();

        await test.println("should return true since compared with itself");
        throwIfFalse(array1.equals(array1));
        throwIfNotEqual(array1.compare(array1), Ordering.Equal);

        await test.println("should return true when arrays have equivalent contents");
        array1 = [1,2,3,4,5];
        array2 = [1,2,3,4,5];
        throwIfFalse(array1.equals(array2));
        throwIfNotEqual(array1.compare(array2), Ordering.Equal);

        await test.println("should return correct Ordering");
        array1 = [1,2,3];
        array2 = [1,2,3,4];
        throwIfNotEqual(array1.compare(array2), Ordering.LessThan);
        throwIfNotEqual(array2.compare(array1), Ordering.GreaterThan);
        array1 = [0,1,2];
        array2 = [1,2,3];
        throwIfNotEqual(array1.compare(array2), Ordering.LessThan);
        throwIfNotEqual(array2.compare(array1), Ordering.GreaterThan);

        await test.println("should return the index of the value in the array if it is found using binarySearch");
        array1 = [1,2,3,4,5];
        throwIfNotEqual(array1.binarySearch(3), 2);

        await test.println("should return -(index + 1) if the value is not found in the array using binarySearch");
        array1 = [1,2,3,4,5];
        throwIfNotEqual(array1.binarySearch(6), -6);
        throwIfNotEqual(array1.binarySearch(0), -1);

        await test.println("should result in an empty array");
        array1 = [1,2,3,4,5];
        array1.clear();
        throwIfNotEqual(array1.length, 0);

        await test.println("should return a new array with the same values as the original using clone");
        array1 = [1,2,3,4,5];
        let clone = array1.clone();
        throwIfFalse(clone.equals(array1));

        await test.println("should return the first element in the array using first");
        array1 = [1,2,3,4,5];
        throwIfNotEqual(array1.first(), 1);

        await test.println("should insert the provided values at the specified index using insert");
        array1 = [1,2,3,4,5];
        array1.insert(2,6,7,8);
        throwIfFalse(array1.equals([1,2,6,7,8,3,4,5]));

        await test.println("should return the last element in the array using last");
        array1 = [1,2,3,4,5];
        throwIfNotEqual(array1.last(), 5);

        await test.println("should remove the element at the specified index using remove");
        array1 = [1,2,3,4,5];
        array1.remove(2);
        throwIfFalse(array1.equals([1,2,4,5]));

    } catch (err) {
        test.error(err);
    }
}