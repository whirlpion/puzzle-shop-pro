"use strict";
function array_test() {
    try {
        test.println("--- Begin Array<T> test ---");
        let array = new Array();
        test.println("should return the index of the value in the array if it is found using binarySearch");
        array = [1, 2, 3, 4, 5];
        throwIfNotEqual(array.binarySearch(3), 2);
        test.println("should return -(index + 1) if the value is not found in the array using binarySearch");
        array = [1, 2, 3, 4, 5];
        throwIfNotEqual(array.binarySearch(6), -6);
        throwIfNotEqual(array.binarySearch(0), -1);
        test.println("should result in an empty array");
        array = [1, 2, 3, 4, 5];
        array.clear();
        throwIfNotEqual(array.length, 0);
        test.println("should return a new array with the same values as the original using clone");
        array = [1, 2, 3, 4, 5];
        let clone = array.clone();
        throwIfNotEqual(clone.cmp(array), Ordering.Equal);
        test.println("should return the first element in the array using first");
        array = [1, 2, 3, 4, 5];
        throwIfNotEqual(array.first(), 1);
        test.println("should insert the provided values at the specified index using insert");
        array = [1, 2, 3, 4, 5];
        array.insert(2, 6, 7, 8);
        throwIfNotEqual(array.cmp([1, 2, 6, 7, 8, 3, 4, 5]), Ordering.Equal);
        test.println("should return the last element in the array using last");
        array = [1, 2, 3, 4, 5];
        throwIfNotEqual(array.last(), 5);
        test.println("should return a new array with all of the values from both arrays using merge");
        let array1 = [1, 3, 5, 7, 9];
        let array2 = [2, 4, 6, 8, 10];
        let merged = array1.merge(array2);
        throwIfNotEqual(merged.cmp([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]), Ordering.Equal);
        test.println("should remove the element at the specified index using remove");
        array = [1, 2, 3, 4, 5];
        array.remove(2);
        throwIfNotEqual(array.cmp([1, 2, 4, 5]), Ordering.Equal);
    }
    catch (err) {
        test.error(err);
    }
}
